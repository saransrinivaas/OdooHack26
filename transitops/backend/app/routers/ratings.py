"""Driver & Vehicle 1-3 star rating endpoints (computed on demand)."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import User
from ..services import ratings_service

router = APIRouter(prefix="/api/ratings", tags=["ratings"])


@router.get("/drivers")
def driver_ratings(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    ratings = ratings_service.compute_all_driver_ratings(db)
    return sorted(ratings.values(), key=lambda r: r["weighted_score"], reverse=True)


@router.get("/vehicles")
def vehicle_ratings(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    ratings = ratings_service.compute_all_vehicle_ratings(db)
    return sorted(ratings.values(), key=lambda r: r["weighted_score"], reverse=True)
