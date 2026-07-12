"""Licence-expiry email reminders (bonus), powered by your existing
license_reminder.py Gmail sender."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import require_roles
from ..config import REMINDER_WINDOW_DAYS
from ..database import get_db
from ..models import Role, User
from ..services import email_service

router = APIRouter(prefix="/api/reminders", tags=["reminders"])
manage = require_roles(Role.SAFETY_OFFICER, Role.FLEET_MANAGER)


@router.get("/due")
def list_due(window: int = REMINDER_WINDOW_DAYS, db: Session = Depends(get_db),
             _: User = Depends(manage)):
    """Preview drivers whose licence expires within `window` days (no email sent)."""
    return {"window_days": window, "drivers": email_service.due_drivers(db, window)}


@router.post("/send")
def send(window: int = REMINDER_WINDOW_DAYS, db: Session = Depends(get_db),
         _: User = Depends(manage)):
    """Send reminder emails to all due drivers via your Gmail sender."""
    return email_service.send_reminders(db, window)
