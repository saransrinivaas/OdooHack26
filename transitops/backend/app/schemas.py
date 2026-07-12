"""Pydantic request/response schemas."""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


# --- Auth ---
class LoginRequest(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str
    email: str


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "Driver"


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True


# --- Vehicle ---
class VehicleBase(BaseModel):
    registration_number: str
    name: str
    type: str
    region: str = ""
    max_load_capacity: float
    odometer: float = 0
    acquisition_cost: float = 0
    acquisition_date: Optional[date] = None
    service_interval_km: float = 10000
    last_service_odometer: float = 0
    status: str = "Available"


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    region: Optional[str] = None
    max_load_capacity: Optional[float] = None
    odometer: Optional[float] = None
    acquisition_cost: Optional[float] = None
    acquisition_date: Optional[date] = None
    service_interval_km: Optional[float] = None
    status: Optional[str] = None


class AcquisitionCostUpdate(BaseModel):
    acquisition_cost: float


class VehicleOut(VehicleBase):
    id: int

    class Config:
        from_attributes = True


# --- Driver ---
class DriverBase(BaseModel):
    name: str
    license_number: str
    license_category: str = ""
    license_expiry: Optional[date] = None
    contact_number: str = ""
    email: str = ""
    safety_score: float = 100
    status: str = "Available"


class DriverCreate(DriverBase):
    pass


class DriverUpdate(BaseModel):
    name: Optional[str] = None
    license_number: Optional[str] = None
    license_category: Optional[str] = None
    license_expiry: Optional[date] = None
    contact_number: Optional[str] = None
    email: Optional[str] = None
    safety_score: Optional[float] = None
    status: Optional[str] = None


class DriverOut(DriverBase):
    id: int
    license_expired: bool = False

    class Config:
        from_attributes = True


# --- Trip ---
class TripCreate(BaseModel):
    source: str
    destination: str
    vehicle_id: int
    driver_id: int
    cargo_weight: float = 0
    planned_distance: float = 0
    planned_duration: Optional[float] = None
    revenue: float = 0


class TripComplete(BaseModel):
    final_odometer: float
    fuel_consumed: float
    revenue: Optional[float] = None


class TripRevenue(BaseModel):
    revenue: float


class TripSuggestRequest(BaseModel):
    cargo_weight: float = 0
    vehicle_type: Optional[str] = None


class TripOut(BaseModel):
    id: int
    source: str
    destination: str
    vehicle_id: int
    driver_id: int
    vehicle_name: Optional[str] = None
    driver_name: Optional[str] = None
    cargo_weight: float
    planned_distance: float
    planned_duration: Optional[float] = None
    actual_distance: Optional[float] = None
    actual_duration: Optional[float] = None
    start_odometer: Optional[float] = None
    final_odometer: Optional[float] = None
    fuel_consumed: Optional[float] = None
    revenue: float
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Maintenance ---
class MaintenanceCreate(BaseModel):
    vehicle_id: int
    service_type: str
    description: str = ""
    cost: float = 0
    is_planned: bool = True
    service_date: Optional[date] = None
    expected_completion_date: Optional[date] = None


class MaintenanceOut(BaseModel):
    id: int
    vehicle_id: int
    vehicle_name: Optional[str] = None
    service_type: str
    description: str
    cost: float
    status: str
    is_planned: bool = True
    service_date: Optional[date] = None
    expected_completion_date: Optional[date] = None

    class Config:
        from_attributes = True


# --- Fuel ---
class FuelCreate(BaseModel):
    vehicle_id: int
    trip_id: Optional[int] = None
    liters: float
    cost: float = 0
    odometer: Optional[float] = None
    log_date: Optional[date] = None


class FuelOut(BaseModel):
    id: int
    vehicle_id: int
    vehicle_name: Optional[str] = None
    trip_id: Optional[int] = None
    liters: float
    cost: float
    odometer: Optional[float] = None
    log_date: Optional[date] = None

    class Config:
        from_attributes = True


# --- Expense ---
class ExpenseCreate(BaseModel):
    vehicle_id: Optional[int] = None
    trip_id: Optional[int] = None
    category: str = "Other"
    amount: float
    description: str = ""
    notes: str = ""
    expense_date: Optional[date] = None


class ExpenseOut(BaseModel):
    id: int
    vehicle_id: Optional[int] = None
    vehicle_name: Optional[str] = None
    trip_id: Optional[int] = None
    category: str
    amount: float
    description: str
    notes: str = ""
    expense_date: Optional[date] = None

    class Config:
        from_attributes = True


# --- Incident ---
class IncidentCreate(BaseModel):
    driver_id: int
    trip_id: Optional[int] = None
    severity: str = "Low"
    description: str
    occurred_at: Optional[datetime] = None


class IncidentOut(BaseModel):
    id: int
    driver_id: int
    driver_name: Optional[str] = None
    trip_id: Optional[int] = None
    severity: str
    description: str
    status: str
    occurred_at: Optional[datetime] = None

    class Config:
        from_attributes = True
