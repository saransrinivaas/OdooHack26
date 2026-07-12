from typing import Optional
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_roles
from ..database import get_db
from ..models import Driver, DriverStatus, Role, User
from ..schemas import DriverCreate, DriverUpdate, DriverOut
from ..business import dispatchable_drivers, license_expired

router = APIRouter(prefix="/api/drivers", tags=["drivers"])

# Permission matrix: Safety Officer owns driver compliance (licence data,
# suspend/reinstate, safety score). Fleet Manager sees the roster read-only.
manage = require_roles(Role.SAFETY_OFFICER, Role.FLEET_MANAGER)


def _out(d: Driver) -> DriverOut:
    o = DriverOut.model_validate(d)
    o.license_expired = license_expired(d)
    return o


@router.get("", response_model=list[DriverOut])
def list_drivers(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort: str = Query("name"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Driver)
    if status:
        q = q.filter(Driver.status == status)
    if search:
        like = f"%{search.lower()}%"
        from sqlalchemy import func, or_
        q = q.filter(or_(
            func.lower(Driver.name).like(like),
            func.lower(Driver.license_number).like(like),
        ))
    sort_col = getattr(Driver, sort, Driver.name)
    return [_out(d) for d in q.order_by(sort_col).all()]


@router.get("/dispatchable", response_model=list[DriverOut])
def list_dispatchable(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Available drivers with a valid (non-expired) licence, not On Trip (rule 4)."""
    return [_out(d) for d in dispatchable_drivers(db)]


@router.get("/{driver_id}", response_model=DriverOut)
def get_driver(driver_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    d = db.query(Driver).get(driver_id)
    if not d:
        raise HTTPException(404, "Driver not found.")
    return _out(d)


@router.post("", response_model=DriverOut)
def create_driver(body: DriverCreate, db: Session = Depends(get_db), _: User = Depends(manage)):
    if body.status not in DriverStatus.ALL:
        raise HTTPException(400, f"Status must be one of {DriverStatus.ALL}.")
    d = Driver(**body.model_dump())
    db.add(d)
    db.commit()
    db.refresh(d)
    return _out(d)


@router.put("/{driver_id}", response_model=DriverOut)
def update_driver(driver_id: int, body: DriverUpdate, db: Session = Depends(get_db),
                  _: User = Depends(manage)):
    d = db.query(Driver).get(driver_id)
    if not d:
        raise HTTPException(404, "Driver not found.")
    data = body.model_dump(exclude_unset=True)
    if "status" in data and data["status"] not in DriverStatus.ALL:
        raise HTTPException(400, f"Status must be one of {DriverStatus.ALL}.")
    for k, val in data.items():
        setattr(d, k, val)
    db.commit()
    db.refresh(d)
    return _out(d)


@router.delete("/{driver_id}")
def delete_driver(driver_id: int, db: Session = Depends(get_db), _: User = Depends(manage)):
    d = db.query(Driver).get(driver_id)
    if not d:
        raise HTTPException(404, "Driver not found.")
    if d.trips:
        d.status = DriverStatus.OFF_DUTY
        db.commit()
        return {"detail": "Driver has trip history; set to Off Duty instead of deleted."}
    db.delete(d)
    db.commit()
    return {"detail": "Driver deleted."}
