"""ORM models for every entity the spec calls out:
Users, Roles, Vehicles, Drivers, Trips, Maintenance Logs, Fuel Logs, Expenses,
plus Documents for the OCR-backed document management bonus.

Status values are kept as plain strings (with the constants below) so the API
and frontend can pass them around as JSON without enum ceremony.
"""
from datetime import datetime, date

from sqlalchemy import (
    Column, Integer, String, Float, Date, DateTime, ForeignKey, Text, Boolean
)
from sqlalchemy.orm import relationship

from .database import Base


# --- Controlled vocabularies (from the PDF) --------------------------------
class Role:
    FLEET_MANAGER = "Fleet Manager"
    DRIVER = "Driver"
    SAFETY_OFFICER = "Safety Officer"
    FINANCIAL_ANALYST = "Financial Analyst"
    ADMIN = "Admin"
    ALL = [FLEET_MANAGER, DRIVER, SAFETY_OFFICER, FINANCIAL_ANALYST, ADMIN]


class VehicleStatus:
    AVAILABLE = "Available"
    ON_TRIP = "On Trip"
    IN_SHOP = "In Shop"
    RETIRED = "Retired"
    ALL = [AVAILABLE, ON_TRIP, IN_SHOP, RETIRED]


class DriverStatus:
    AVAILABLE = "Available"
    ON_TRIP = "On Trip"
    OFF_DUTY = "Off Duty"
    SUSPENDED = "Suspended"
    ALL = [AVAILABLE, ON_TRIP, OFF_DUTY, SUSPENDED]


class TripStatus:
    DRAFT = "Draft"
    DISPATCHED = "Dispatched"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"
    ALL = [DRAFT, DISPATCHED, COMPLETED, CANCELLED]


class MaintenanceStatus:
    OPEN = "Open"
    CLOSED = "Closed"
    ALL = [OPEN, CLOSED]


class ExpenseCategory:
    TOLL = "Toll"
    FINE = "Fine"
    PARKING = "Parking"
    OTHER = "Other"
    ALL = [TOLL, FINE, PARKING, OTHER]


class IncidentSeverity:
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    ALL = [LOW, MEDIUM, HIGH]


class IncidentStatus:
    OPEN = "Open"
    RESOLVED = "Resolved"
    ALL = [OPEN, RESOLVED]


# --- Tables ----------------------------------------------------------------
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default=Role.DRIVER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Vehicle(Base):
    __tablename__ = "vehicles"
    id = Column(Integer, primary_key=True)
    registration_number = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)              # Name / Model
    type = Column(String, nullable=False)              # Van, Truck, Car, ...
    region = Column(String, default="")                # for dashboard filters
    max_load_capacity = Column(Float, nullable=False)  # kg
    odometer = Column(Float, default=0)                # km
    acquisition_cost = Column(Float, default=0)
    acquisition_date = Column(Date, nullable=True)     # feeds avg-vehicle-age KPI
    last_service_odometer = Column(Float, default=0)   # set when maintenance closes
    service_interval_km = Column(Float, default=10000) # drives maintenance prediction
    status = Column(String, default=VehicleStatus.AVAILABLE)
    created_at = Column(DateTime, default=datetime.utcnow)

    trips = relationship("Trip", back_populates="vehicle")
    maintenance_logs = relationship("MaintenanceLog", back_populates="vehicle")
    fuel_logs = relationship("FuelLog", back_populates="vehicle")
    expenses = relationship("Expense", back_populates="vehicle")
    documents = relationship("Document", back_populates="vehicle")


class Driver(Base):
    __tablename__ = "drivers"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # optional login link
    name = Column(String, nullable=False)
    license_number = Column(String, nullable=False, index=True)
    license_category = Column(String, default="")      # LMV, HMV, ...
    license_expiry = Column(Date, nullable=True)
    contact_number = Column(String, default="")
    email = Column(String, default="")                 # used by reminder emails
    safety_score = Column(Float, default=100)
    status = Column(String, default=DriverStatus.AVAILABLE)
    created_at = Column(DateTime, default=datetime.utcnow)

    trips = relationship("Trip", back_populates="driver")
    documents = relationship("Document", back_populates="driver")


class Trip(Base):
    __tablename__ = "trips"
    id = Column(Integer, primary_key=True)
    source = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    cargo_weight = Column(Float, default=0)            # kg
    planned_distance = Column(Float, default=0)        # km
    planned_duration = Column(Float, nullable=True)    # hours; feeds on-time KPI
    actual_distance = Column(Float, nullable=True)     # set on completion
    actual_duration = Column(Float, nullable=True)     # hours; completedAt - dispatchedAt
    start_odometer = Column(Float, nullable=True)
    final_odometer = Column(Float, nullable=True)
    fuel_consumed = Column(Float, nullable=True)       # liters (at completion)
    revenue = Column(Float, default=0)                 # for ROI
    status = Column(String, default=TripStatus.DRAFT)
    created_at = Column(DateTime, default=datetime.utcnow)
    dispatched_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    vehicle = relationship("Vehicle", back_populates="trips")
    driver = relationship("Driver", back_populates="trips")


class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"
    id = Column(Integer, primary_key=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    service_type = Column(String, nullable=False)      # Oil Change, Tyre, ...
    description = Column(Text, default="")
    cost = Column(Float, default=0)
    status = Column(String, default=MaintenanceStatus.OPEN)
    is_planned = Column(Boolean, default=True)         # scheduled service vs unplanned repair
    service_date = Column(Date, default=date.today)
    expected_completion_date = Column(Date, nullable=True)  # ETA while In Shop
    closed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="maintenance_logs")


class FuelLog(Base):
    __tablename__ = "fuel_logs"
    id = Column(Integer, primary_key=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True)
    liters = Column(Float, nullable=False)
    cost = Column(Float, default=0)
    odometer = Column(Float, nullable=True)
    log_date = Column(Date, default=date.today)
    created_at = Column(DateTime, default=datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="fuel_logs")


class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True)
    category = Column(String, default="Other")         # Toll, Fine, Parking, Other
    amount = Column(Float, nullable=False)
    description = Column(String, default="")
    notes = Column(String, default="")
    expense_date = Column(Date, default=date.today)
    created_at = Column(DateTime, default=datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="expenses")


class Document(Base):
    """Vehicle / driver document management. When a driving licence image is
    uploaded, your OCR pipeline fills the parsed_* fields automatically."""
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    doc_type = Column(String, default="Other")         # Driving Licence, RC, Insurance, Permit ...
    document_number = Column(String, default="")       # reference number
    expiry_date = Column(Date, nullable=True)          # drives the expiry-tracker widget
    filename = Column(String, nullable=False)
    stored_path = Column(String, nullable=False)
    # OCR output (JSON-encoded) when the doc is a driving licence
    ocr_verdict = Column(String, default="")
    ocr_data = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="documents")
    driver = relationship("Driver", back_populates="documents")


class Incident(Base):
    """Safety incident / violation logged against a driver (Safety Officer)."""
    __tablename__ = "incidents"
    id = Column(Integer, primary_key=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True)
    severity = Column(String, default=IncidentSeverity.LOW)   # Low / Medium / High
    description = Column(Text, nullable=False)
    status = Column(String, default=IncidentStatus.OPEN)      # Open / Resolved
    logged_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    occurred_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    driver = relationship("Driver")
