from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_roles
from ..config import UPLOAD_DIR
from ..database import get_db
from ..models import Trip, Vehicle, Driver, TripStatus, Role, User
from ..schemas import TripCreate, TripComplete, TripOut, TripRevenue, TripSuggestRequest, TripUpdate
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
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
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


@router.put("/{trip_id}", response_model=TripOut)
def update_trip(trip_id: int, body: TripUpdate, db: Session = Depends(get_db),
                _: User = Depends(own_trips)):
    """Edit/reassign driver and vehicle for an active/draft trip."""
    t = db.query(Trip).get(trip_id)
    if not t:
        raise HTTPException(404, "Trip not found.")
    if t.status in (TripStatus.COMPLETED, TripStatus.CANCELLED):
        raise HTTPException(400, f"Cannot update a {t.status} trip.")

    data = body.model_dump(exclude_unset=True)

    # Check vehicle swap
    if "vehicle_id" in data and data["vehicle_id"] != t.vehicle_id:
        new_v = db.query(Vehicle).get(data["vehicle_id"])
        if not new_v:
            raise HTTPException(400, "New vehicle not found.")
        old_v = db.query(Vehicle).get(t.vehicle_id)
        
        if t.status == TripStatus.DISPATCHED:
            if new_v.status != VehicleStatus.AVAILABLE:
                raise HTTPException(400, f"New vehicle {new_v.registration_number} is not Available.")
            if old_v:
                old_v.status = VehicleStatus.AVAILABLE
            new_v.status = VehicleStatus.ON_TRIP
            t.start_odometer = new_v.odometer
        t.vehicle_id = new_v.id

    # Check driver swap
    if "driver_id" in data and data["driver_id"] != t.driver_id:
        new_d = db.query(Driver).get(data["driver_id"])
        if not new_d:
            raise HTTPException(400, "New driver not found.")
        old_d = db.query(Driver).get(t.driver_id)
        
        if t.status == TripStatus.DISPATCHED:
            if new_d.status != DriverStatus.AVAILABLE or business.license_expired(new_d):
                raise HTTPException(400, f"New driver {new_d.name} is not Available/Valid.")
            if old_d:
                old_d.status = DriverStatus.AVAILABLE
            new_d.status = DriverStatus.ON_TRIP
        t.driver_id = new_d.id

    # Update other fields
    for k in ("source", "destination", "cargo_weight", "planned_distance", "planned_duration", "revenue"):
        if k in data:
            setattr(t, k, data[k])

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


@router.post("/{trip_id}/pod", response_model=TripOut)
def upload_pod(
    trip_id: int, 
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    _: User = Depends(complete_trips)
):
    import uuid
    import shutil
    t = db.query(Trip).get(trip_id)
    if not t:
        raise HTTPException(404, "Trip not found.")
    
    stored = UPLOAD_DIR / f"pod_{uuid.uuid4().hex}_{file.filename}"
    with stored.open("wb") as out:
        shutil.copyfileobj(file.file, out)
        
    t.pod_image_path = str(stored)
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
