"""Bridge to your existing Gmail licence-reminder (repo-root license_reminder.py).

The platform pulls drivers from the database, builds the same reminder message
your script produces, and sends it through your existing Gmail sender — so the
'Email reminders for expiring licences' bonus reuses code you already tested.
"""
import sys
from datetime import date

from ..config import REPO_ROOT, REMINDER_WINDOW_DAYS, GMAIL_USER, GMAIL_APP_PASSWORD
from ..models import Driver

if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

try:
    import license_reminder  # your existing reminder script
    REMINDER_AVAILABLE = True
except Exception as exc:  # pragma: no cover
    license_reminder = None
    REMINDER_AVAILABLE = False
    _IMPORT_ERROR = str(exc)


def _driver_to_record(driver: Driver) -> dict:
    return {
        "name": driver.name,
        "email": driver.email,
        "license_no": driver.license_number,
        "expiry_date": driver.license_expiry.isoformat() if driver.license_expiry else None,
    }


def due_drivers(db, window: int = REMINDER_WINDOW_DAYS):
    """Drivers whose licence expires within `window` days (or already expired)."""
    today = date.today()
    out = []
    for d in db.query(Driver).all():
        if not d.license_expiry:
            continue
        days = (d.license_expiry - today).days
        if days <= window:
            out.append({
                "driver_id": d.id,
                "name": d.name,
                "email": d.email,
                "license_no": d.license_number,
                "expiry_date": d.license_expiry.isoformat(),
                "days_left": days,
                "expired": days < 0,
            })
    out.sort(key=lambda r: r["days_left"])
    return out


def send_reminders(db, window: int = REMINDER_WINDOW_DAYS):
    """Send a reminder to every due driver with an email address.
    Returns a per-driver result list (sent / skipped / failed)."""
    today = date.today()
    results = []

    if not REMINDER_AVAILABLE:
        return {"error": f"Reminder module unavailable: {_IMPORT_ERROR}", "results": []}
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        return {"error": "GMAIL_USER / GMAIL_APP_PASSWORD missing in .env — cannot send.",
                "results": []}

    for row in due_drivers(db, window):
        if not row["email"]:
            results.append({**row, "status": "skipped", "reason": "no email on file"})
            continue
        record = {"name": row["name"], "email": row["email"],
                  "license_no": row["license_no"], "expiry_date": row["expiry_date"]}
        subject, body = license_reminder.build_message(record, today)
        try:
            license_reminder.send_email(row["email"], subject, body)
            results.append({**row, "status": "sent"})
        except Exception as e:
            results.append({**row, "status": "failed", "reason": str(e)})

    sent = sum(1 for r in results if r["status"] == "sent")
    return {"error": None, "sent": sent, "total": len(results), "results": results}
