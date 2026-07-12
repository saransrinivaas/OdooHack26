"""Seed demo data on first run.

Creates 6 users (one per role + admin), 8 vehicles, 8 drivers, 15+ trips
(a mix of completed, dispatched, draft, cancelled), maintenance logs, fuel
logs, expenses and incidents — enough to make every dashboard look real.
"""
from datetime import date, datetime, timedelta
import random

from .auth import hash_password
from .database import SessionLocal, engine, Base
from .models import (
    User, Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense, Incident,
    Role, VehicleStatus, DriverStatus, TripStatus, MaintenanceStatus, IncidentSeverity,
)

DEMO_PASSWORD = "transitops123"
REMINDER_EMAIL = "ahsansaleem2006@gmail.com"

USERS = [
    ("System Admin",      "admin@transitops.com",   Role.ADMIN),
    ("Fiona Fleet",       "manager@transitops.com", Role.FLEET_MANAGER),
    ("Dan Driver",        "driver@transitops.com",  Role.DRIVER),
    ("Sam Safety",        "safety@transitops.com",  Role.SAFETY_OFFICER),
    ("Fay Finance",       "finance@transitops.com", Role.FINANCIAL_ANALYST),
]

def _today():
    return date.today()

def _dt(days_ago=0, hours_ago=0):
    return datetime.utcnow() - timedelta(days=days_ago, hours=hours_ago)

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            return  # already seeded

        # ------------------------------------------------------------------
        # Users
        # ------------------------------------------------------------------
        users = {}
        for name, email, role in USERS:
            u = User(name=name, email=email,
                     password_hash=hash_password(DEMO_PASSWORD), role=role)
            db.add(u)
            users[role] = u
        db.flush()
        manager_id = users[Role.FLEET_MANAGER].id
        safety_id  = users[Role.SAFETY_OFFICER].id

        # ------------------------------------------------------------------
        # Vehicles (8)
        # ------------------------------------------------------------------
        vehicles = [
            Vehicle(registration_number="TN01AB1234", name="Tata Ace",
                    type="Van",   region="South", max_load_capacity=500,
                    odometer=14200, acquisition_cost=650000,
                    acquisition_date=_today()-timedelta(days=500),
                    service_interval_km=10000, last_service_odometer=10000,
                    status=VehicleStatus.ON_TRIP),
            Vehicle(registration_number="MH12CD5678", name="Ashok Leyland 1918",
                    type="Truck", region="North", max_load_capacity=9000,
                    odometer=91000, acquisition_cost=2800000,
                    acquisition_date=_today()-timedelta(days=1100),
                    service_interval_km=15000, last_service_odometer=80000,
                    status=VehicleStatus.AVAILABLE),
            Vehicle(registration_number="KA05EF9012", name="Toyota Etios",
                    type="Car",   region="South", max_load_capacity=400,
                    odometer=43500, acquisition_cost=850000,
                    acquisition_date=_today()-timedelta(days=800),
                    service_interval_km=10000, last_service_odometer=40000,
                    status=VehicleStatus.ON_TRIP),
            Vehicle(registration_number="DL08GH3456", name="Mahindra Supro",
                    type="Van",   region="West",  max_load_capacity=600,
                    odometer=55000, acquisition_cost=720000,
                    acquisition_date=_today()-timedelta(days=950),
                    service_interval_km=10000, last_service_odometer=50000,
                    status=VehicleStatus.IN_SHOP),
            Vehicle(registration_number="GJ09IJ7890", name="Eicher Pro 2095",
                    type="Truck", region="West",  max_load_capacity=7500,
                    odometer=67000, acquisition_cost=2200000,
                    acquisition_date=_today()-timedelta(days=700),
                    service_interval_km=15000, last_service_odometer=60000,
                    status=VehicleStatus.AVAILABLE),
            Vehicle(registration_number="RJ14KL2345", name="Force Traveller",
                    type="Van",   region="North", max_load_capacity=1200,
                    odometer=32000, acquisition_cost=1100000,
                    acquisition_date=_today()-timedelta(days=400),
                    service_interval_km=10000, last_service_odometer=30000,
                    status=VehicleStatus.ON_TRIP),
            Vehicle(registration_number="AP28MN6789", name="Maruti Omni",
                    type="Car",   region="South", max_load_capacity=350,
                    odometer=88000, acquisition_cost=300000,
                    acquisition_date=_today()-timedelta(days=2200),
                    service_interval_km=8000,  last_service_odometer=80000,
                    status=VehicleStatus.AVAILABLE),
            Vehicle(registration_number="WB19OP1122", name="BharatBenz 1217C",
                    type="Truck", region="East",  max_load_capacity=12000,
                    odometer=310000, acquisition_cost=3100000,
                    acquisition_date=_today()-timedelta(days=2600),
                    service_interval_km=15000, last_service_odometer=305000,
                    status=VehicleStatus.RETIRED),
        ]
        db.add_all(vehicles)
        v = {v.registration_number: v for v in vehicles}
        db.flush()

        # ------------------------------------------------------------------
        # Drivers (8)
        # ------------------------------------------------------------------
        drivers_data = [
            # (name, lic_num, category, expiry_offset_days, contact, score, status)
            ("Dan Driver",    "TN02 20240006663", "LMV, MCWG",  400, "9876543210", 92, DriverStatus.ON_TRIP),
            ("Priya Nair",    "KA05 20220005678", "LMV, HMV",    20, "9811122233", 78, DriverStatus.AVAILABLE),
            ("Ravi Singh",    "MH12 20190009999", "HMV",        -15, "9700011122", 65, DriverStatus.AVAILABLE),   # expired
            ("Mohan Das",     "DL08 20210004444", "LMV, HGMV",  300, "9600055566", 40, DriverStatus.SUSPENDED),
            ("Suresh Babu",   "GJ09 20230007777", "LMV",        180, "9500044455", 88, DriverStatus.AVAILABLE),
            ("Kavitha Raj",   "AP22 20210003333", "LMV, HMV",    90, "9400033344", 81, DriverStatus.AVAILABLE),
            ("Deepak Mehta",  "RJ14 20180008888", "HMV, HGMV",  500, "9300022233", 95, DriverStatus.AVAILABLE),
            ("Zara Sheikh",   "TN07 20220001111", "LMV",         10, "9200011122", 73, DriverStatus.AVAILABLE),   # expiring soon
        ]
        drivers = []
        for i, (name, lic, cat, exp_offset, contact, score, status) in enumerate(drivers_data):
            email = "driver@transitops.com" if i == 0 else REMINDER_EMAIL
            d = Driver(
                name=name, license_number=lic, license_category=cat,
                license_expiry=_today() + timedelta(days=exp_offset),
                contact_number=contact, email=email,
                safety_score=score, status=status,
            )
            db.add(d)
            drivers.append(d)
        db.flush()

        # Link 'driver@transitops.com' user to the first driver record
        drivers[0].user_id = users[Role.DRIVER].id
        db.flush()

        drv = {d.name: d for d in drivers}
        veh = {v.registration_number: v for v in vehicles}

        # ------------------------------------------------------------------
        # Trips  (15 — mix of all statuses)
        # ------------------------------------------------------------------
        def make_trip(src, dst, reg, drv_name, cargo, pdist, pdur, rev,
                      status, days_ago=0, adist=None, adur=None,
                      s_odo=None, f_odo=None, fuel=None):
            veh_obj = veh[reg]
            drv_obj = drv[drv_name]
            t = Trip(
                source=src, destination=dst,
                vehicle_id=veh_obj.id, driver_id=drv_obj.id,
                created_by_user_id=manager_id,
                cargo_weight=cargo, planned_distance=pdist,
                planned_duration=pdur, revenue=rev,
                status=status,
                created_at=_dt(days_ago=days_ago + 1),
            )
            if status == TripStatus.DISPATCHED:
                t.dispatched_at = _dt(days_ago=days_ago, hours_ago=2)
            if status == TripStatus.COMPLETED:
                t.dispatched_at = _dt(days_ago=days_ago, hours_ago=int(pdur or 6) + 1)
                t.completed_at  = _dt(days_ago=days_ago)
                t.actual_distance = adist or pdist
                t.actual_duration = adur or pdur
                t.start_odometer  = s_odo
                t.final_odometer  = f_odo
                t.fuel_consumed   = fuel
            return t

        trips_list = [
            # Completed trips (history for charts/ratings)
            make_trip("Chennai",   "Bangalore",  "MH12CD5678", "Priya Nair",   6000, 350, 6.0,  42000, TripStatus.COMPLETED, days_ago=30, adist=360, adur=6.5, s_odo=88000, f_odo=88360, fuel=95),
            make_trip("Mumbai",    "Pune",       "GJ09IJ7890", "Deepak Mehta", 5000, 160, 3.0,  22000, TripStatus.COMPLETED, days_ago=25, adist=162, adur=3.2, s_odo=66000, f_odo=66162, fuel=55),
            make_trip("Delhi",     "Jaipur",     "RJ14KL2345", "Suresh Babu",   800, 285, 5.0,  15000, TripStatus.COMPLETED, days_ago=20, adist=290, adur=5.5, s_odo=31000, f_odo=31290, fuel=78),
            make_trip("Hyderabad", "Chennai",    "TN01AB1234", "Dan Driver",    400, 625, 10.0, 28000, TripStatus.COMPLETED, days_ago=18, adist=630, adur=10.5,s_odo=13000, f_odo=13630, fuel=102),
            make_trip("Chennai",   "Coimbatore", "KA05EF9012", "Kavitha Raj",   300, 500, 8.0,  21000, TripStatus.COMPLETED, days_ago=15, adist=502, adur=8.0, s_odo=42500, f_odo=43002, fuel=60),
            make_trip("Kolkata",   "Patna",      "MH12CD5678", "Priya Nair",   8000, 560, 9.0,  55000, TripStatus.COMPLETED, days_ago=12, adist=570, adur=9.5, s_odo=88360, f_odo=88930, fuel=140),
            make_trip("Bangalore", "Mysore",     "TN01AB1234", "Dan Driver",    350, 145, 3.0,   9500, TripStatus.COMPLETED, days_ago=10, adist=147, adur=3.1, s_odo=13630, f_odo=13777, fuel=38),
            make_trip("Mumbai",    "Nagpur",     "GJ09IJ7890", "Deepak Mehta", 7000, 820, 13.0, 68000, TripStatus.COMPLETED, days_ago=7,  adist=830, adur=13.5,s_odo=66162, f_odo=66992, fuel=210),
            make_trip("Delhi",     "Chandigarh", "AP28MN6789", "Zara Sheikh",   300, 250, 4.5,  13000, TripStatus.COMPLETED, days_ago=5,  adist=252, adur=4.8, s_odo=87000, f_odo=87252, fuel=62),
            make_trip("Chennai",   "Madurai",    "KA05EF9012", "Kavitha Raj",   350, 460, 8.0,  18000, TripStatus.COMPLETED, days_ago=3,  adist=465, adur=8.5, s_odo=43002, f_odo=43467, fuel=72),

            # Cancelled
            make_trip("Mumbai", "Ahmedabad", "TN01AB1234", "Dan Driver", 450, 530, 9.0, 25000, TripStatus.CANCELLED, days_ago=22),

            # Dispatched (currently active)
            make_trip("Delhi",  "Lucknow",  "RJ14KL2345", "Dan Driver", 900, 560, 8.5, 32000, TripStatus.DISPATCHED, days_ago=0),
            make_trip("Mumbai", "Pune",     "TN01AB1234", "Dan Driver", 300, 160, 3.0, 18000, TripStatus.DISPATCHED, days_ago=0),
            make_trip("Bangalore", "Chennai", "KA05EF9012", "Dan Driver", 250, 350, 6.0, 25000, TripStatus.DISPATCHED, days_ago=0),

            # Drafts (pending)
            make_trip("Chennai", "Bangalore", "MH12CD5678", "Dan Driver",   5500, 350, 6.0, 40000, TripStatus.DRAFT),
            make_trip("Mumbai",  "Surat",     "GJ09IJ7890", "Deepak Mehta", 6000, 280, 5.0, 30000, TripStatus.DRAFT),
            make_trip("Delhi",   "Agra",      "TN01AB1234", "Kavitha Raj",   300, 200, 3.5, 11000, TripStatus.DRAFT),
        ]
        for t in trips_list:
            db.add(t)
        db.flush()

        # ------------------------------------------------------------------
        # Fuel Logs (tie to completed trips)
        # ------------------------------------------------------------------
        completed_trips = [t for t in trips_list if t.status == TripStatus.COMPLETED]
        for t in completed_trips:
            if t.fuel_consumed:
                db.add(FuelLog(
                    vehicle_id=t.vehicle_id, trip_id=t.id,
                    liters=t.fuel_consumed,
                    cost=round(t.fuel_consumed * 96, 2),   # ~96/L diesel
                    odometer=t.final_odometer,
                    log_date=(t.completed_at.date() if t.completed_at else _today()),
                ))
        # A couple of stand-alone fill-ups (no trip)
        db.add(FuelLog(vehicle_id=veh["TN01AB1234"].id, liters=30, cost=2880, odometer=14200, log_date=_today()-timedelta(days=2)))
        db.add(FuelLog(vehicle_id=veh["KA05EF9012"].id, liters=25, cost=2400, odometer=43500, log_date=_today()-timedelta(days=4)))
        # An anomalous fill-up (very high cost/L — will be flagged by anomaly detector)
        db.add(FuelLog(vehicle_id=veh["MH12CD5678"].id, liters=10, cost=4500, odometer=91000, log_date=_today()-timedelta(days=1)))

        # ------------------------------------------------------------------
        # Maintenance Logs
        # ------------------------------------------------------------------
        db.add_all([
            # VAN-07 (Mahindra Supro) is in shop
            MaintenanceLog(vehicle_id=veh["DL08GH3456"].id, service_type="Clutch Replacement",
                           description="Clutch plate worn out — urgent repair",
                           cost=14500, is_planned=False, status=MaintenanceStatus.OPEN,
                           service_date=_today()-timedelta(days=1),
                           expected_completion_date=_today()+timedelta(days=2)),
            # Closed logs (history)
            MaintenanceLog(vehicle_id=veh["MH12CD5678"].id, service_type="Oil Change",
                           description="Routine 90k service", cost=3200, is_planned=True,
                           status=MaintenanceStatus.CLOSED, service_date=_today()-timedelta(days=10),
                           closed_at=_dt(days_ago=10)),
            MaintenanceLog(vehicle_id=veh["TN01AB1234"].id, service_type="Tyre Rotation",
                           description="All four tyres rotated", cost=1800, is_planned=True,
                           status=MaintenanceStatus.CLOSED, service_date=_today()-timedelta(days=25),
                           closed_at=_dt(days_ago=25)),
            MaintenanceLog(vehicle_id=veh["GJ09IJ7890"].id, service_type="Brake Overhaul",
                           description="Front disc pads replaced", cost=8500, is_planned=True,
                           status=MaintenanceStatus.CLOSED, service_date=_today()-timedelta(days=40),
                           closed_at=_dt(days_ago=40)),
            MaintenanceLog(vehicle_id=veh["AP28MN6789"].id, service_type="Engine Tune-up",
                           description="Filters, plugs replaced", cost=4200, is_planned=False,
                           status=MaintenanceStatus.CLOSED, service_date=_today()-timedelta(days=60),
                           closed_at=_dt(days_ago=60)),
        ])

        # ------------------------------------------------------------------
        # Expenses
        # ------------------------------------------------------------------
        expense_data = [
            # (reg, category, amount, description, days_ago)
            ("MH12CD5678", "Toll",    1250, "NH44 toll Chennai-Bangalore",      30),
            ("GJ09IJ7890", "Toll",    1800, "Mumbai-Pune expressway toll",       25),
            ("RJ14KL2345", "Parking", 600,  "City parking, 3 days",              20),
            ("AP28MN6789", "Parking", 450,  "Depot parking fee",                 18),
            ("TN01AB1234", "Toll",    950,  "NH48 toll Bangalore-Mysore",        10),
            ("KA05EF9012", "Toll",    2100, "NH7 toll Chennai-Coimbatore",        3),
            ("MH12CD5678", "Fine",    3000, "Overloading penalty (MH check-post)",15),
            ("GJ09IJ7890", "Other",  12000, "Tarpaulin replacement",              7),
            # Anomalous expense (much higher than category avg)
            ("TN01AB1234", "Toll",   15000, "Special vehicle clearance fee",      2),
        ]
        for reg, cat, amt, desc, days_ago in expense_data:
            db.add(Expense(
                vehicle_id=veh[reg].id, category=cat, amount=amt,
                description=desc, expense_date=_today()-timedelta(days=days_ago)
            ))

        # ------------------------------------------------------------------
        # Incidents
        # ------------------------------------------------------------------
        db.add_all([
            Incident(driver_id=drv["Ravi Singh"].id, severity=IncidentSeverity.MEDIUM,
                     description="Minor scrape while reversing at a narrow loading bay; no injuries.",
                     logged_by_user_id=safety_id, status="Open",
                     occurred_at=_dt(days_ago=20)),
            Incident(driver_id=drv["Mohan Das"].id, severity=IncidentSeverity.HIGH,
                     description="Ran a red light in Pune junction — traffic ticket issued.",
                     logged_by_user_id=safety_id, status="Open",
                     occurred_at=_dt(days_ago=45)),
            Incident(driver_id=drv["Mohan Das"].id, severity=IncidentSeverity.MEDIUM,
                     description="Overloading complaint from highway check-post.",
                     logged_by_user_id=safety_id, status="Resolved",
                     occurred_at=_dt(days_ago=80)),
            Incident(driver_id=drv["Zara Sheikh"].id, severity=IncidentSeverity.LOW,
                     description="Arrived 4 hours late due to unplanned route detour; cargo intact.",
                     logged_by_user_id=safety_id, status="Resolved",
                     occurred_at=_dt(days_ago=10)),
        ])

        db.commit()
        print("[OK] Seeded demo data — 6 users, 8 vehicles, 8 drivers, 15 trips, fuel/maintenance/expense/incident logs.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
