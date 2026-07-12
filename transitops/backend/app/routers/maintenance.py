from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_roles
from ..database import get_db
from ..models import MaintenanceLog, Vehicle, MaintenanceStatus, Role, User
from ..schemas import MaintenanceCreate, MaintenanceOut
from .. import business

router = APIRouter(prefix="/api/maintenance", tags=["maintenance"])
manage = require_roles(Role.FLEET_MANAGER)


def _out(db: Session, m: MaintenanceLog) -> MaintenanceOut:
    o = MaintenanceOut.model_validate(m)
    v = db.query(Vehicle).get(m.vehicle_id)
    o.vehicle_name = v.registration_number if v else None
    return o


@router.get("", response_model=list[MaintenanceOut])
def list_logs(status: str | None = Query(None), vehicle_id: int | None = Query(None),
              db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    q = db.query(MaintenanceLog)
    if status:
        q = q.filter(MaintenanceLog.status == status)
    if vehicle_id:
        q = q.filter(MaintenanceLog.vehicle_id == vehicle_id)
    return [_out(db, m) for m in q.order_by(MaintenanceLog.id.desc()).all()]


@router.post("", response_model=MaintenanceOut)
def create_log(body: MaintenanceCreate, db: Session = Depends(get_db), _: User = Depends(manage)):
    """Creating an active maintenance record puts the vehicle In Shop (rule 4),
    which automatically removes it from the dispatch pool."""
    vehicle = db.query(Vehicle).get(body.vehicle_id)
    if not vehicle:
        raise HTTPException(404, "Vehicle not found.")
    m = MaintenanceLog(
        vehicle_id=body.vehicle_id, service_type=body.service_type,
        description=body.description, cost=body.cost,
        is_planned=body.is_planned,
        service_date=body.service_date or date.today(),
        expected_completion_date=body.expected_completion_date,
        status=MaintenanceStatus.OPEN,
    )
    business.open_maintenance(db, vehicle)
    db.add(m)
    db.commit()
    db.refresh(m)
    return _out(db, m)


@router.post("/{log_id}/close", response_model=MaintenanceOut)
def close_log(log_id: int, db: Session = Depends(get_db), _: User = Depends(manage)):
    """Closing maintenance restores the vehicle to Available unless retired."""
    m = db.query(MaintenanceLog).get(log_id)
    if not m:
        raise HTTPException(404, "Maintenance record not found.")
    if m.status == MaintenanceStatus.CLOSED:
        raise HTTPException(400, "This maintenance record is already closed.")
    business.close_maintenance(db, m)
    db.commit()
    db.refresh(m)
    return _out(db, m)


@router.delete("/{log_id}")
def delete_log(log_id: int, db: Session = Depends(get_db), _: User = Depends(manage)):
    m = db.query(MaintenanceLog).get(log_id)
    if not m:
        raise HTTPException(404, "Maintenance record not found.")
    if m.status == MaintenanceStatus.OPEN:
        business.close_maintenance(db, m)
    db.delete(m)
    db.commit()
    return {"detail": "Maintenance record deleted."}
