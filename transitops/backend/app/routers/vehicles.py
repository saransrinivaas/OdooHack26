from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_roles
from ..database import get_db
from ..models import Vehicle, VehicleStatus, Role, User
from ..schemas import VehicleCreate, VehicleUpdate, VehicleOut, AcquisitionCostUpdate
from ..business import dispatchable_vehicles

router = APIRouter(prefix="/api/vehicles", tags=["vehicles"])

# Fleet Managers (and Admin) own the vehicle registry
manage = require_roles(Role.FLEET_MANAGER)
# Financial Analyst may set acquisition cost (drives ROI) — matrix exception.
acq_roles = require_roles(Role.FINANCIAL_ANALYST, Role.FLEET_MANAGER)


@router.get("", response_model=list[VehicleOut])
def list_vehicles(
    status: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort: str = Query("registration_number"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Vehicle)
    if status:
        q = q.filter(Vehicle.status == status)
    if type:
        q = q.filter(Vehicle.type == type)
    if region:
        q = q.filter(Vehicle.region == region)
    if search:
        like = f"%{search.lower()}%"
        from sqlalchemy import func, or_
        q = q.filter(or_(
            func.lower(Vehicle.registration_number).like(like),
            func.lower(Vehicle.name).like(like),
            func.lower(Vehicle.type).like(like),
        ))
    sort_col = getattr(Vehicle, sort, Vehicle.registration_number)
    return q.order_by(sort_col).all()


@router.get("/dispatchable", response_model=list[VehicleOut])
def list_dispatchable(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Only Available vehicles — Retired/In-Shop/On-Trip are excluded (rule 4)."""
    return dispatchable_vehicles(db)


@router.get("/{vehicle_id}", response_model=VehicleOut)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    v = db.query(Vehicle).get(vehicle_id)
    if not v:
        raise HTTPException(404, "Vehicle not found.")
    return v


@router.post("", response_model=VehicleOut)
def create_vehicle(body: VehicleCreate, db: Session = Depends(get_db), _: User = Depends(manage)):
    if body.status not in VehicleStatus.ALL:
        raise HTTPException(400, f"Status must be one of {VehicleStatus.ALL}.")
    if db.query(Vehicle).filter(Vehicle.registration_number == body.registration_number).first():
        raise HTTPException(400, "Registration number must be unique — that one already exists.")
    v = Vehicle(**body.model_dump())
    db.add(v)
    db.commit()
    db.refresh(v)
    return v


@router.put("/{vehicle_id}", response_model=VehicleOut)
def update_vehicle(vehicle_id: int, body: VehicleUpdate, db: Session = Depends(get_db),
                   _: User = Depends(manage)):
    v = db.query(Vehicle).get(vehicle_id)
    if not v:
        raise HTTPException(404, "Vehicle not found.")
    data = body.model_dump(exclude_unset=True)
    if "status" in data and data["status"] not in VehicleStatus.ALL:
        raise HTTPException(400, f"Status must be one of {VehicleStatus.ALL}.")
    for k, val in data.items():
        setattr(v, k, val)
    db.commit()
    db.refresh(v)
    return v


@router.put("/{vehicle_id}/acquisition-cost", response_model=VehicleOut)
def set_acquisition_cost(vehicle_id: int, body: AcquisitionCostUpdate,
                         db: Session = Depends(get_db), _: User = Depends(acq_roles)):
    """Financial Analyst sets acquisition cost used by the ROI calculation."""
    v = db.query(Vehicle).get(vehicle_id)
    if not v:
        raise HTTPException(404, "Vehicle not found.")
    v.acquisition_cost = body.acquisition_cost
    db.commit()
    db.refresh(v)
    return v


@router.delete("/{vehicle_id}")
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db), _: User = Depends(manage)):
    v = db.query(Vehicle).get(vehicle_id)
    if not v:
        raise HTTPException(404, "Vehicle not found.")
    if v.trips:
        # keep history intact — retire instead of hard-deleting
        v.status = VehicleStatus.RETIRED
        db.commit()
        return {"detail": "Vehicle has trip history; marked Retired instead of deleted."}
    db.delete(v)
    db.commit()
    return {"detail": "Vehicle deleted."}
