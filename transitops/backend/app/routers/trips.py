from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_roles
from ..database import get_db
from ..models import Trip, Vehicle, Driver, TripStatus, Role, User
from ..schemas import TripCreate, TripComplete, TripOut, TripRevenue, TripSuggestRequest
from .. import business

router = APIRouter(prefix="/api/trips", tags=["trips"])

# Permission matrix: Fleet Manager owns trip creation / dispatch / cancel.
own_trips = require_roles(Role.FLEET_MANAGER)
# Driver may complete an assigned trip (execution action); FM may too.
complete_trips = require_roles(Role.DRIVER, Role.FLEET_MANAGER)
# Financial Analyst (and FM) enter trip revenue.
revenue_roles = require_roles(Role.FINANCIAL_ANALYST, Role.FLEET_MANAGER)


def _out(db: Session, t: Trip) -> TripOut:
    o = TripOut.model_validate(t)
    v = db.query(Vehicle).get(t.vehicle_id)
    d = db.query(Driver).get(t.driver_id)
    o.vehicle_name = v.registration_number if v else None
    o.driver_name = d.name if d else None
    return o


@router.get("", response_model=list[TripOut])
def list_trips(
    status: str | None = Query(None),
    search: str | None = Query(None),
    sort: str = Query("-id"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Trip)
    if status:
        q = q.filter(Trip.status == status)
    if search:
        like = f"%{search.lower()}%"
        from sqlalchemy import func, or_
        q = q.filter(or_(
            func.lower(Trip.source).like(like),
            func.lower(Trip.destination).like(like),
        ))
    desc = sort.startswith("-")
    col = getattr(Trip, sort.lstrip("-"), Trip.id)
    q = q.order_by(col.desc() if desc else col.asc())
    return [_out(db, t) for t in q.all()]


@router.post("/suggest")
def suggest(body: TripSuggestRequest, db: Session = Depends(get_db),
            _: User = Depends(own_trips)):
    """Assignment algorithm: hard-filter eligible vehicles/drivers, soft-score
    them, and return the best (vehicle, driver) pair to pre-fill the form."""
    return business.suggest_assignment(db, body.cargo_weight, body.vehicle_type)


@router.get("/{trip_id}", response_model=TripOut)
def get_trip(trip_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    t = db.query(Trip).get(trip_id)
    if not t:
        raise HTTPException(404, "Trip not found.")
    return _out(db, t)


@router.post("", response_model=TripOut)
def create_trip(body: TripCreate, db: Session = Depends(get_db),
                user: User = Depends(own_trips)):
    """Create a Draft trip. All mandatory rules are validated up-front."""
    vehicle = db.query(Vehicle).get(body.vehicle_id)
    driver = db.query(Driver).get(body.driver_id)
    business.validate_assignment(db, vehicle, driver, body.cargo_weight)

    t = Trip(
        source=body.source, destination=body.destination,
        vehicle_id=body.vehicle_id, driver_id=body.driver_id,
        created_by_user_id=user.id,
        cargo_weight=body.cargo_weight, planned_distance=body.planned_distance,
        planned_duration=body.planned_duration, revenue=body.revenue,
        status=TripStatus.DRAFT,
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return _out(db, t)


@router.post("/{trip_id}/dispatch", response_model=TripOut)
def dispatch(trip_id: int, db: Session = Depends(get_db), _: User = Depends(own_trips)):
    t = db.query(Trip).get(trip_id)
    if not t:
        raise HTTPException(404, "Trip not found.")
    business.dispatch_trip(db, t)
    db.commit()
    db.refresh(t)
    return _out(db, t)


@router.post("/{trip_id}/complete", response_model=TripOut)
def complete(trip_id: int, body: TripComplete, db: Session = Depends(get_db),
             _: User = Depends(complete_trips)):
    t = db.query(Trip).get(trip_id)
    if not t:
        raise HTTPException(404, "Trip not found.")
    business.complete_trip(db, t, body.final_odometer, body.fuel_consumed, body.revenue)
    db.commit()
    db.refresh(t)
    return _out(db, t)


@router.post("/{trip_id}/cancel", response_model=TripOut)
def cancel(trip_id: int, db: Session = Depends(get_db), _: User = Depends(own_trips)):
    t = db.query(Trip).get(trip_id)
    if not t:
        raise HTTPException(404, "Trip not found.")
    business.cancel_trip(db, t)
    db.commit()
    db.refresh(t)
    return _out(db, t)


@router.put("/{trip_id}/revenue", response_model=TripOut)
def set_revenue(trip_id: int, body: TripRevenue, db: Session = Depends(get_db),
                _: User = Depends(revenue_roles)):
    """Financial Analyst / Fleet Manager set the revenue used for ROI + profit."""
    t = db.query(Trip).get(trip_id)
    if not t:
        raise HTTPException(404, "Trip not found.")
    t.revenue = body.revenue
    db.commit()
    db.refresh(t)
    return _out(db, t)


@router.delete("/{trip_id}")
def delete_trip(trip_id: int, db: Session = Depends(get_db), _: User = Depends(own_trips)):
    t = db.query(Trip).get(trip_id)
    if not t:
        raise HTTPException(404, "Trip not found.")
    if t.status == TripStatus.DISPATCHED:
        raise HTTPException(400, "Cancel the trip before deleting it.")
    db.delete(t)
    db.commit()
    return {"detail": "Trip deleted."}
