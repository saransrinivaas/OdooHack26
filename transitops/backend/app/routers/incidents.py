"""Safety incident / violation log (Safety Officer). Feeds the driver rating's
incident-free component."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_roles
from ..database import get_db
from ..models import Incident, Driver, Role, User, IncidentSeverity, IncidentStatus
from ..schemas import IncidentCreate, IncidentOut

router = APIRouter(prefix="/api/incidents", tags=["incidents"])
manage = require_roles(Role.SAFETY_OFFICER)


def _out(db: Session, i: Incident) -> IncidentOut:
    o = IncidentOut.model_validate(i)
    d = db.query(Driver).get(i.driver_id)
    o.driver_name = d.name if d else None
    return o


@router.get("", response_model=list[IncidentOut])
def list_incidents(driver_id: int | None = Query(None), status: str | None = Query(None),
                   db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    q = db.query(Incident)
    if driver_id:
        q = q.filter(Incident.driver_id == driver_id)
    if status:
        q = q.filter(Incident.status == status)
    return [_out(db, i) for i in q.order_by(Incident.id.desc()).all()]


@router.post("", response_model=IncidentOut)
def create_incident(body: IncidentCreate, db: Session = Depends(get_db),
                    user: User = Depends(manage)):
    if not db.query(Driver).get(body.driver_id):
        raise HTTPException(404, "Driver not found.")
    if body.severity not in IncidentSeverity.ALL:
        raise HTTPException(400, f"Severity must be one of {IncidentSeverity.ALL}.")
    i = Incident(
        driver_id=body.driver_id, trip_id=body.trip_id, severity=body.severity,
        description=body.description, logged_by_user_id=user.id,
        occurred_at=body.occurred_at or datetime.utcnow(),
    )
    db.add(i)
    db.commit()
    db.refresh(i)
    return _out(db, i)


@router.post("/{incident_id}/resolve", response_model=IncidentOut)
def resolve(incident_id: int, db: Session = Depends(get_db), _: User = Depends(manage)):
    i = db.query(Incident).get(incident_id)
    if not i:
        raise HTTPException(404, "Incident not found.")
    i.status = IncidentStatus.RESOLVED
    db.commit()
    db.refresh(i)
    return _out(db, i)


@router.delete("/{incident_id}")
def delete_incident(incident_id: int, db: Session = Depends(get_db), _: User = Depends(manage)):
    i = db.query(Incident).get(incident_id)
    if not i:
        raise HTTPException(404, "Incident not found.")
    db.delete(i)
    db.commit()
    return {"detail": "Incident deleted."}
