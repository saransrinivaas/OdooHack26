"""Seed demo data on first run: one user per role, plus vehicles, drivers,
trips, maintenance, fuel, expenses and an incident that mirror the PDF specs
(Van-05 / Alex, 450 kg <= 500 kg) so every screen and rating has data."""
from datetime import date, datetime, timedelta

from .auth import hash_password
from .database import SessionLocal, engine, Base
from .models import (
    User, Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense, Incident,
    Role, VehicleStatus, DriverStatus, TripStatus, MaintenanceStatus, IncidentSeverity,
)

DEMO_PASSWORD = "transitops123"
REMINDER_EMAIL = "ahsanonmeet@gmail.com"   # licence-reminder recipient (demo)

USERS = [
    ("Admin User", "admin@transitops.com", Role.ADMIN),
    ("Fiona Fleet", "manager@transitops.com", Role.FLEET_MANAGER),
    ("Dan Driver", "driver@transitops.com", Role.DRIVER),
    ("Sam Safety", "safety@transitops.com", Role.SAFETY_OFFICER),
    ("Fay Finance", "finance@transitops.com", Role.FINANCIAL_ANALYST),
]


def _today():
    return date.today()


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            return  # already seeded

        # --- Users (one per role) ---
        users = {}
        for name, email, role in USERS:
            u = User(name=name, email=email,
                     password_hash=hash_password(DEMO_PASSWORD), role=role)
            db.add(u)
            users[role] = u
        db.flush()
        manager_id = users[Role.FLEET_MANAGER].id
        safety_id = users[Role.SAFETY_OFFICER].id

        # --- Vehicles (with acquisition date + service interval/last-service) ---
        v_van = Vehicle(registration_number="VAN-05", name="Tata Ace", type="Van",
                        region="South", max_load_capacity=500, odometer=12000,
                        acquisition_cost=650000, acquisition_date=_today() - timedelta(days=500),
                        service_interval_km=10000, last_service_odometer=10000,
                        status=VehicleStatus.AVAILABLE)
        v_truck = Vehicle(registration_number="TRK-11", name="Ashok Leyland 1918", type="Truck",
                          region="North", max_load_capacity=9000, odometer=88000,
                          acquisition_cost=2800000, acquisition_date=_today() - timedelta(days=1100),
                          service_interval_km=15000, last_service_odometer=80000,
                          status=VehicleStatus.AVAILABLE)
        v_car = Vehicle(registration_number="CAR-02", name="Toyota Etios", type="Car",
                        region="South", max_load_capacity=400, odometer=41000,
                        acquisition_cost=850000, acquisition_date=_today() - timedelta(days=800),
                        service_interval_km=10000, last_service_odometer=40000,
                        status=VehicleStatus.AVAILABLE)
        v_shop = Vehicle(registration_number="VAN-07", name="Mahindra Supro", type="Van",
                         region="West", max_load_capacity=600, odometer=53000,
                         acquisition_cost=720000, acquisition_date=_today() - timedelta(days=950),
                         service_interval_km=10000, last_service_odometer=50000,
                         status=VehicleStatus.IN_SHOP)
        v_ret = Vehicle(registration_number="TRK-03", name="Eicher Pro (old)", type="Truck",
                        region="East", max_load_capacity=7000, odometer=310000,
                        acquisition_cost=2100000, acquisition_date=_today() - timedelta(days=2600),
                        service_interval_km=15000, last_service_odometer=305000,
                        status=VehicleStatus.RETIRED)
        db.add_all([v_van, v_truck, v_car, v_shop, v_ret])

        # --- Drivers (reminder email = ahsanonmeet@gmail.com) ---
        d_alex = Driver(name="Alex Kumar", license_number="TN02 20240006663",
                        license_category="LMV, MCWG", license_expiry=_today() + timedelta(days=400),
                        contact_number="9876543210", email=REMINDER_EMAIL,
                        safety_score=92, status=DriverStatus.AVAILABLE)
        d_priya = Driver(name="Priya Nair", license_number="KA05 20220005678",
                         license_category="LMV, HMV", license_expiry=_today() + timedelta(days=20),
                         contact_number="9811122233", email=REMINDER_EMAIL,
                         safety_score=78, status=DriverStatus.AVAILABLE)
        d_ravi = Driver(name="Ravi Singh", license_number="MH12 20190009999",
                        license_category="HMV", license_expiry=_today() - timedelta(days=15),
                        contact_number="9700011122", email=REMINDER_EMAIL,
                        safety_score=65, status=DriverStatus.AVAILABLE)  # expired -> not dispatchable
        d_suspended = Driver(name="Mohan Das", license_number="DL08 20210004444",
                             license_category="LMV, HGMV", license_expiry=_today() + timedelta(days=300),
                             contact_number="9600055566", email=REMINDER_EMAIL,
                             safety_score=40, status=DriverStatus.SUSPENDED)
        db.add_all([d_alex, d_priya, d_ravi, d_suspended])
        db.flush()  # assign IDs

        # --- A completed trip (feeds reports + ratings) ---
        t_done = Trip(source="Chennai", destination="Bangalore",
                      vehicle_id=v_truck.id, driver_id=d_priya.id, created_by_user_id=manager_id,
                      cargo_weight=6000, planned_distance=350, planned_duration=6,
                      actual_distance=360, actual_duration=6.5,
                      start_odometer=88000, final_odometer=88360,
                      fuel_consumed=95, revenue=42000, status=TripStatus.COMPLETED,
                      dispatched_at=datetime.utcnow() - timedelta(days=3, hours=7),
                      completed_at=datetime.utcnow() - timedelta(days=3))
        db.add(t_done)

        # --- A draft (pending) trip ---
        t_draft = Trip(source="Chennai", destination="Madurai",
                       vehicle_id=v_van.id, driver_id=d_alex.id, created_by_user_id=manager_id,
                       cargo_weight=450, planned_distance=460, planned_duration=8, revenue=18000,
                       status=TripStatus.DRAFT)
        db.add(t_draft)
        db.flush()

        # --- Fuel logs ---
        db.add_all([
            FuelLog(vehicle_id=v_truck.id, trip_id=t_done.id, liters=95, cost=9200,
                    odometer=88360, log_date=_today() - timedelta(days=3)),
            FuelLog(vehicle_id=v_van.id, liters=30, cost=2850,
                    odometer=12000, log_date=_today() - timedelta(days=5)),
            FuelLog(vehicle_id=v_car.id, liters=25, cost=2300,
                    odometer=41000, log_date=_today() - timedelta(days=7)),
        ])

        # --- Maintenance (open unplanned keeps VAN-07 In Shop; planned oil change) ---
        db.add_all([
            MaintenanceLog(vehicle_id=v_shop.id, service_type="Clutch Replacement",
                           description="Clutch plate worn out", cost=14500, is_planned=False,
                           status=MaintenanceStatus.OPEN, service_date=_today() - timedelta(days=1),
                           expected_completion_date=_today() + timedelta(days=2)),
            MaintenanceLog(vehicle_id=v_truck.id, service_type="Oil Change",
                           description="Routine 90k service", cost=3200, is_planned=True,
                           status=MaintenanceStatus.CLOSED, service_date=_today() - timedelta(days=10)),
        ])

        # --- Expenses (Toll / Parking categories) ---
        db.add_all([
            Expense(vehicle_id=v_truck.id, trip_id=t_done.id, category="Toll",
                    amount=1250, description="NH toll Chennai-Bangalore",
                    expense_date=_today() - timedelta(days=3)),
            Expense(vehicle_id=v_van.id, category="Parking", amount=600,
                    description="City parking", expense_date=_today() - timedelta(days=4)),
        ])

        # --- A safety incident (feeds driver rating incident-free component) ---
        db.add(Incident(driver_id=d_ravi.id, severity=IncidentSeverity.MEDIUM,
                        description="Minor scrape while reversing; no injuries.",
                        logged_by_user_id=safety_id,
                        occurred_at=datetime.utcnow() - timedelta(days=20)))

        db.commit()
        print("✅ Seeded demo data (5 users, 5 vehicles, 4 drivers, 2 trips, 1 incident, ...).")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
