from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_roles
from ..database import get_db
from ..models import FuelLog, Vehicle, Role, User
from ..schemas import FuelCreate, FuelOut

router = APIRouter(prefix="/api/fuel", tags=["fuel"])
# Permission matrix: fuel is logged by Fleet Manager and Drivers (own trip).
manage = require_roles(Role.FLEET_MANAGER, Role.DRIVER)


def _out(db: Session, f: FuelLog) -> FuelOut:
    o = FuelOut.model_validate(f)
    v = db.query(Vehicle).get(f.vehicle_id)
    o.vehicle_name = v.registration_number if v else None
    return o


@router.get("", response_model=list[FuelOut])
def list_fuel(vehicle_id: int | None = Query(None), db: Session = Depends(get_db),
              _: User = Depends(get_current_user)):
    q = db.query(FuelLog)
    if vehicle_id:
        q = q.filter(FuelLog.vehicle_id == vehicle_id)
    return [_out(db, f) for f in q.order_by(FuelLog.id.desc()).all()]


@router.post("", response_model=FuelOut)
def create_fuel(body: FuelCreate, db: Session = Depends(get_db), _: User = Depends(manage)):
    if not db.query(Vehicle).get(body.vehicle_id):
        raise HTTPException(404, "Vehicle not found.")
    if body.liters <= 0:
        raise HTTPException(400, "Litres must be greater than zero.")
    f = FuelLog(
        vehicle_id=body.vehicle_id, trip_id=body.trip_id, liters=body.liters,
        cost=body.cost, odometer=body.odometer, log_date=body.log_date or date.today(),
    )
    db.add(f)
    db.commit()
    db.refresh(f)
    return _out(db, f)


@router.delete("/{fuel_id}")
def delete_fuel(fuel_id: int, db: Session = Depends(get_db), _: User = Depends(manage)):
    f = db.query(FuelLog).get(fuel_id)
    if not f:
        raise HTTPException(404, "Fuel log not found.")
    db.delete(f)
    db.commit()
    return {"detail": "Fuel log deleted."}
