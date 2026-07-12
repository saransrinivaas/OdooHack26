from typing import Optional
from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import (Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense, Incident,
                      VehicleStatus, DriverStatus, TripStatus, MaintenanceStatus,
                      IncidentStatus, User)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/kpis")
def kpis(
    type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """All dashboard KPIs from section 3.2, honouring type/status/region filters."""
    vq = db.query(Vehicle)
    if type:
        vq = vq.filter(Vehicle.type == type)
    if status:
        vq = vq.filter(Vehicle.status == status)
    if region:
        vq = vq.filter(Vehicle.region == region)
    vehicles = vq.all()

    total = len(vehicles)
    available = sum(1 for v in vehicles if v.status == VehicleStatus.AVAILABLE)
    on_trip = sum(1 for v in vehicles if v.status == VehicleStatus.ON_TRIP)
    in_shop = sum(1 for v in vehicles if v.status == VehicleStatus.IN_SHOP)
    retired = sum(1 for v in vehicles if v.status == VehicleStatus.RETIRED)
    active = total - retired  # "active" fleet = everything not retired

    # Fleet utilization = vehicles currently On Trip / active fleet
    utilization = round((on_trip / active) * 100, 1) if active else 0.0

    active_trips = db.query(func.count(Trip.id)).filter(Trip.status == TripStatus.DISPATCHED).scalar()
    pending_trips = db.query(func.count(Trip.id)).filter(Trip.status == TripStatus.DRAFT).scalar()
    completed_trips = db.query(func.count(Trip.id)).filter(Trip.status == TripStatus.COMPLETED).scalar()
    drivers_on_duty = db.query(func.count(Driver.id)).filter(Driver.status == DriverStatus.ON_TRIP).scalar()
    drivers_available = db.query(func.count(Driver.id)).filter(Driver.status == DriverStatus.AVAILABLE).scalar()
    open_maint = db.query(func.count(MaintenanceLog.id)).filter(
        MaintenanceLog.status == MaintenanceStatus.OPEN).scalar()

    return {
        "active_vehicles": active,
        "available_vehicles": available,
        "on_trip_vehicles": on_trip,
        "in_maintenance": in_shop,
        "retired_vehicles": retired,
        "total_vehicles": total,
        "active_trips": active_trips,
        "pending_trips": pending_trips,
        "completed_trips": completed_trips,
        "drivers_on_duty": drivers_on_duty,
        "drivers_available": drivers_available,
        "open_maintenance": open_maint,
        "fleet_utilization": utilization,
        "status_breakdown": {
            "Available": available, "On Trip": on_trip,
            "In Shop": in_shop, "Retired": retired,
        },
    }


@router.get("/overview")
def overview(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """The six consolidated high-level metrics shown at the top of every
    dashboard (Metrics doc, section 1)."""
    today = date.today()

    active_trips = db.query(func.count(Trip.id)).filter(Trip.status == TripStatus.DISPATCHED).scalar()

    on_trip = db.query(func.count(Vehicle.id)).filter(Vehicle.status == VehicleStatus.ON_TRIP).scalar()
    non_retired = db.query(func.count(Vehicle.id)).filter(Vehicle.status != VehicleStatus.RETIRED).scalar()
    utilization = round((on_trip / non_retired) * 100, 1) if non_retired else 0.0

    active_drivers = db.query(Driver).filter(Driver.status != DriverStatus.SUSPENDED).all()
    compliant = sum(1 for d in active_drivers if d.license_expiry and d.license_expiry > today)
    compliance_rate = round((compliant / len(active_drivers)) * 100, 1) if active_drivers else 100.0

    revenue = db.query(func.coalesce(func.sum(Trip.revenue), 0)).filter(Trip.status == TripStatus.COMPLETED).scalar()
    fuel = db.query(func.coalesce(func.sum(FuelLog.cost), 0)).scalar()
    maint = db.query(func.coalesce(func.sum(MaintenanceLog.cost), 0)).scalar()
    other = db.query(func.coalesce(func.sum(Expense.amount), 0)).scalar()
    net_profit = round(revenue - (fuel + maint + other), 2)

    in_maintenance = db.query(func.count(Vehicle.id)).filter(Vehicle.status == VehicleStatus.IN_SHOP).scalar()

    expiring_soon = db.query(func.count(Driver.id)).filter(
        Driver.license_expiry != None, Driver.license_expiry < today + timedelta(days=30)).scalar()  # noqa: E711
    suspended = db.query(func.count(Driver.id)).filter(Driver.status == DriverStatus.SUSPENDED).scalar()
    open_incidents = db.query(func.count(Incident.id)).filter(Incident.status == IncidentStatus.OPEN).scalar()
    safety_flags = (expiring_soon or 0) + (suspended or 0) + (open_incidents or 0)

    return {
        "active_trips": active_trips,
        "fleet_utilization": utilization,
        "compliance_rate": compliance_rate,
        "net_profit": net_profit,
        "vehicles_in_maintenance": in_maintenance,
        "open_safety_flags": safety_flags,
    }


@router.get("/safety")
def safety(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Compliance + safety data for the Safety Officer view."""
    today = date.today()
    drivers = db.query(Driver).all()
    buckets = {"30": 0, "60": 0, "90": 0, "expired": 0}
    for d in drivers:
        if not d.license_expiry:
            continue
        days = (d.license_expiry - today).days
        if days < 0:
            buckets["expired"] += 1
        elif days <= 30:
            buckets["30"] += 1
        elif days <= 60:
            buckets["60"] += 1
        elif days <= 90:
            buckets["90"] += 1

    active = [d for d in drivers if d.status != DriverStatus.SUSPENDED]
    compliant = sum(1 for d in active if d.license_expiry and d.license_expiry > today)
    compliance_rate = round((compliant / len(active)) * 100, 1) if active else 100.0
    suspended = sum(1 for d in drivers if d.status == DriverStatus.SUSPENDED)
    open_incidents = db.query(func.count(Incident.id)).filter(Incident.status == IncidentStatus.OPEN).scalar()

    return {
        "compliance_rate": compliance_rate,
        "expiring_buckets": buckets,
        "suspended_drivers": suspended,
        "open_incidents": open_incidents,
        "total_drivers": len(drivers),
    }


@router.get("/filters")
def filter_options(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Distinct values to populate the dashboard filter dropdowns."""
    types = [r[0] for r in db.query(Vehicle.type).distinct().all() if r[0]]
    regions = [r[0] for r in db.query(Vehicle.region).distinct().all() if r[0]]
    return {"types": sorted(types), "regions": sorted(regions), "statuses": VehicleStatus.ALL}
