"""All the mandatory business rules from section 4 of the spec live here, in
one place, so the transitions can't drift apart across endpoints.
"""
from datetime import date

from fastapi import HTTPException
from sqlalchemy.orm import Session

from .models import (
    Vehicle, Driver, Trip,
    VehicleStatus, DriverStatus, TripStatus, MaintenanceStatus, MaintenanceLog,
)


# --- Eligibility helpers ---------------------------------------------------
def license_expired(driver: Driver, today: date = None) -> bool:
    today = today or date.today()
    return bool(driver.license_expiry and driver.license_expiry < today)


def dispatchable_vehicles(db: Session):
    """Retired or In-Shop vehicles must never appear in dispatch selection."""
    return (
        db.query(Vehicle)
        .filter(Vehicle.status == VehicleStatus.AVAILABLE)
        .order_by(Vehicle.registration_number)
        .all()
    )


def dispatchable_drivers(db: Session):
    """Suspended / expired-licence / on-trip drivers are excluded."""
    today = date.today()
    drivers = (
        db.query(Driver)
        .filter(Driver.status == DriverStatus.AVAILABLE)
        .order_by(Driver.name)
        .all()
    )
    return [d for d in drivers if not license_expired(d, today)]


# --- Validation used at trip creation / dispatch --------------------------
def validate_assignment(db: Session, vehicle: Vehicle, driver: Driver,
                        cargo_weight: float):
    """Raise HTTP 400 if any mandatory rule is violated."""
    if vehicle is None:
        raise HTTPException(400, "Vehicle not found.")
    if driver is None:
        raise HTTPException(400, "Driver not found.")

    # Retired / In Shop vehicles cannot be dispatched
    if vehicle.status in (VehicleStatus.RETIRED, VehicleStatus.IN_SHOP):
        raise HTTPException(400, f"Vehicle {vehicle.registration_number} is "
                                 f"{vehicle.status} and cannot be dispatched.")
    # Already on a trip
    if vehicle.status == VehicleStatus.ON_TRIP:
        raise HTTPException(400, f"Vehicle {vehicle.registration_number} is already On Trip.")
    if driver.status == DriverStatus.ON_TRIP:
        raise HTTPException(400, f"Driver {driver.name} is already On Trip.")
    # Suspended driver
    if driver.status == DriverStatus.SUSPENDED:
        raise HTTPException(400, f"Driver {driver.name} is Suspended and cannot be assigned.")
    if driver.status == DriverStatus.OFF_DUTY:
        raise HTTPException(400, f"Driver {driver.name} is Off Duty and cannot be assigned.")
    # Expired licence
    if license_expired(driver):
        raise HTTPException(400, f"Driver {driver.name}'s licence expired on "
                                 f"{driver.license_expiry:%d-%m-%Y}.")
    # Cargo vs capacity
    if cargo_weight > vehicle.max_load_capacity:
        raise HTTPException(400, f"Cargo weight {cargo_weight:g} kg exceeds "
                                 f"{vehicle.registration_number}'s capacity of "
                                 f"{vehicle.max_load_capacity:g} kg.")


# --- Automatic status transitions -----------------------------------------
def dispatch_trip(db: Session, trip: Trip):
    """Draft -> Dispatched. Vehicle & driver both become On Trip."""
    if trip.status != TripStatus.DRAFT:
        raise HTTPException(400, f"Only Draft trips can be dispatched (this one is {trip.status}).")
    vehicle = db.query(Vehicle).get(trip.vehicle_id)
    driver = db.query(Driver).get(trip.driver_id)
    validate_assignment(db, vehicle, driver, trip.cargo_weight)

    from datetime import datetime
    trip.status = TripStatus.DISPATCHED
    trip.dispatched_at = datetime.utcnow()
    trip.start_odometer = vehicle.odometer
    vehicle.status = VehicleStatus.ON_TRIP
    driver.status = DriverStatus.ON_TRIP


def complete_trip(db: Session, trip: Trip, final_odometer: float,
                  fuel_consumed: float, revenue: float = None):
    """Dispatched -> Completed. Vehicle & driver both return to Available.
    Records final odometer + fuel; auto-creates a fuel log for the trip."""
    if trip.status != TripStatus.DISPATCHED:
        raise HTTPException(400, f"Only Dispatched trips can be completed (this one is {trip.status}).")
    vehicle = db.query(Vehicle).get(trip.vehicle_id)
    driver = db.query(Driver).get(trip.driver_id)

    if final_odometer is not None and final_odometer < (trip.start_odometer or 0):
        raise HTTPException(400, "Final odometer cannot be less than the starting odometer.")

    from datetime import datetime
    now = datetime.utcnow()
    trip.status = TripStatus.COMPLETED
    trip.completed_at = now
    trip.final_odometer = final_odometer
    trip.fuel_consumed = fuel_consumed
    if revenue is not None:
        trip.revenue = revenue

    # Derived actuals (feed the rating scores + fuel-efficiency KPI)
    if final_odometer is not None and trip.start_odometer is not None:
        trip.actual_distance = final_odometer - trip.start_odometer
    if trip.dispatched_at:
        trip.actual_duration = round((now - trip.dispatched_at).total_seconds() / 3600, 2)

    # Move the vehicle's odometer forward
    if final_odometer is not None:
        vehicle.odometer = final_odometer

    # Log the fuel that this trip consumed so reports/efficiency stay accurate
    if fuel_consumed and fuel_consumed > 0:
        from .models import FuelLog
        db.add(FuelLog(
            vehicle_id=vehicle.id, trip_id=trip.id, liters=fuel_consumed,
            cost=0, odometer=final_odometer, log_date=date.today(),
        ))

    vehicle.status = VehicleStatus.AVAILABLE
    driver.status = DriverStatus.AVAILABLE


def cancel_trip(db: Session, trip: Trip):
    """Cancelling a Dispatched trip restores vehicle & driver to Available.
    Draft trips can also be cancelled (nothing to restore)."""
    if trip.status in (TripStatus.COMPLETED, TripStatus.CANCELLED):
        raise HTTPException(400, f"A {trip.status} trip cannot be cancelled.")
    if trip.status == TripStatus.DISPATCHED:
        vehicle = db.query(Vehicle).get(trip.vehicle_id)
        driver = db.query(Driver).get(trip.driver_id)
        if vehicle and vehicle.status == VehicleStatus.ON_TRIP:
            vehicle.status = VehicleStatus.AVAILABLE
        if driver and driver.status == DriverStatus.ON_TRIP:
            driver.status = DriverStatus.AVAILABLE
    trip.status = TripStatus.CANCELLED


def open_maintenance(db: Session, vehicle: Vehicle):
    """Creating an active maintenance record -> vehicle In Shop.
    A vehicle currently On Trip can't be pulled into the shop."""
    if vehicle.status == VehicleStatus.ON_TRIP:
        raise HTTPException(400, f"Vehicle {vehicle.registration_number} is On Trip; "
                                 f"complete or cancel its trip before servicing.")
    if vehicle.status != VehicleStatus.RETIRED:
        vehicle.status = VehicleStatus.IN_SHOP


def close_maintenance(db: Session, log: MaintenanceLog):
    """Closing maintenance restores the vehicle to Available (unless retired),
    but only if it has no other still-open maintenance records."""
    from datetime import datetime
    log.status = MaintenanceStatus.CLOSED
    log.closed_at = datetime.utcnow()
    vehicle = db.query(Vehicle).get(log.vehicle_id)
    if not vehicle:
        return
    other_open = (
        db.query(MaintenanceLog)
        .filter(MaintenanceLog.vehicle_id == vehicle.id,
                MaintenanceLog.status == MaintenanceStatus.OPEN,
                MaintenanceLog.id != log.id)
        .count()
    )
    # Record the odometer at last service — feeds the maintenance-risk score
    vehicle.last_service_odometer = vehicle.odometer
    if other_open == 0 and vehicle.status != VehicleStatus.RETIRED:
        vehicle.status = VehicleStatus.AVAILABLE


# ---------------------------------------------------------------------------
# Trip -> Vehicle & Driver assignment algorithm (Metrics doc, section 2)
# ---------------------------------------------------------------------------
HEAVY_TYPES = ("truck", "lorry", "bus", "trailer", "tanker")
HEAVY_CLASSES = ("HMV", "HGMV", "HTV", "HPMV", "HEAVY", "TRANS", "HGV")


def category_compatible(license_category: str, vehicle_type: str) -> bool:
    """Heavy vehicles require a heavy licence class; everything else accepts any."""
    if not vehicle_type:
        return True
    if vehicle_type.lower() in HEAVY_TYPES:
        cat = (license_category or "").upper()
        return any(h in cat for h in HEAVY_CLASSES)
    return True


def _capacity_fit(vehicle, cargo):
    if not vehicle.max_load_capacity:
        return 0.0
    return max(0.0, 1 - abs(vehicle.max_load_capacity - cargo) / vehicle.max_load_capacity)


def _maintenance_risk(vehicle):
    interval = vehicle.service_interval_km or 10000
    used = (vehicle.odometer or 0) - (vehicle.last_service_odometer or 0)
    return 1 - min(1.0, max(0.0, used) / interval)


def _trips_today(db, driver_id, today):
    from datetime import datetime
    start = datetime(today.year, today.month, today.day)
    return db.query(Trip).filter(Trip.driver_id == driver_id,
                                 Trip.created_at >= start).count()


def _idle_bonus(db, vehicle_id, now):
    last = (db.query(Trip)
            .filter(Trip.vehicle_id == vehicle_id, Trip.completed_at.isnot(None))
            .order_by(Trip.completed_at.desc()).first())
    if not last or not last.completed_at:
        return 1.0
    hours = (now - last.completed_at).total_seconds() / 3600
    return min(1.0, hours / 24)


def suggest_assignment(db, cargo_weight: float, vehicle_type: str = None):
    """Return the best (vehicle, driver) pair + all scored candidates.
    Hard filters remove ineligible options; soft scoring ranks the rest."""
    from datetime import datetime, date as _date
    now = datetime.utcnow()
    today = _date.today()

    vehicles = [v for v in dispatchable_vehicles(db)
                if v.max_load_capacity >= cargo_weight]
    drivers = dispatchable_drivers(db)

    max_trips_today = max([_trips_today(db, d.id, today) for d in drivers], default=0) or 1

    def driver_score(d):
        fair = 1 - (_trips_today(db, d.id, today) / max_trips_today)
        return {"safety": (d.safety_score or 0) / 100, "fair": fair}

    best, scored = None, []
    for v in vehicles:
        v_type = vehicle_type or v.type
        elig_drivers = [d for d in drivers if category_compatible(d.license_category, v_type)]
        cf = _capacity_fit(v, cargo_weight)
        mr = _maintenance_risk(v)
        ib = _idle_bonus(db, v.id, now)
        for d in elig_drivers:
            ds = driver_score(d)
            score = (0.30 * cf + 0.25 * ds["safety"] + 0.20 * mr
                     + 0.15 * ds["fair"] + 0.10 * ib)
            entry = {
                "vehicle_id": v.id, "vehicle": v.registration_number,
                "driver_id": d.id, "driver": d.name,
                "score": round(score, 3),
                "capacity_fit": round(cf, 2), "safety": round(ds["safety"], 2),
                "maintenance_risk": round(mr, 2), "fair_rotation": round(ds["fair"], 2),
                "idle_bonus": round(ib, 2),
            }
            scored.append(entry)
            if best is None or score > best["score"]:
                best = entry

    scored.sort(key=lambda e: e["score"], reverse=True)
    return {"best": best, "candidates": scored[:8],
            "eligible_vehicles": len(vehicles), "eligible_drivers": len(drivers)}
