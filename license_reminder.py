"""
License-expiry email reminder.

Reads licenses.json, finds licences that are expiring soon (or already expired),
and emails each holder via Gmail SMTP.

Usage:
    python3 license_reminder.py --dry-run     # show who WOULD be emailed (sends nothing)
    python3 license_reminder.py               # automatic run: email the due ones (skips anyone
                                              #   reminded in the last 7 days, so it won't spam)
    python3 license_reminder.py --send-now    # manual "send now": email everyone due, ignore the 7-day skip
    python3 license_reminder.py --days 45      # change the "expiring soon" window (default 30 days)

Email setup (Gmail, free): put these two lines in your .env file
    GMAIL_USER=your_address@gmail.com
    GMAIL_APP_PASSWORD=your_16_char_app_password
(Create an App Password at https://myaccount.google.com/apppasswords — needs 2-Step Verification on.)
"""

import os
import ssl
import json
import smtplib
import argparse
from email.message import EmailMessage
from datetime import date
from dotenv import load_dotenv

load_dotenv()

LICENSES_FILE = "licenses.json"
DEFAULT_WINDOW_DAYS = 30          # "expiring soon" = within this many days
RESEND_AFTER_DAYS = 7             # don't re-remind the same person within this many days
GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")   # optional: gets a copy of every reminder


# ---------------------------------------------------------------------------
# Data
# ---------------------------------------------------------------------------
def load_licenses(path=LICENSES_FILE):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_licenses(records, path=LICENSES_FILE):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2)
        f.write("\n")


def _parse_date(s):
    try:
        return date.fromisoformat(s)
    except (ValueError, TypeError):
        return None


def days_left(record, today):
    exp = _parse_date(record.get("expiry_date"))
    return (exp - today).days if exp else None


def is_due(record, today, window):
    """Due if it expires within `window` days OR has already expired."""
    d = days_left(record, today)
    return d is not None and d <= window


def recently_reminded(record, today):
    last = _parse_date(record.get("last_reminded"))
    return last is not None and (today - last).days < RESEND_AFTER_DAYS


# ---------------------------------------------------------------------------
# Email
# ---------------------------------------------------------------------------
def build_message(record, today):
    d = days_left(record, today)
    exp = record.get("expiry_date")
    if d < 0:
        headline = f"has EXPIRED ({abs(d)} day(s) ago)"
        subject = f"⚠️ Your driving licence has expired ({exp})"
    elif d == 0:
        headline = "expires TODAY"
        subject = f"⚠️ Your driving licence expires today ({exp})"
    else:
        headline = f"expires in {d} day(s)"
        subject = f"Reminder: your driving licence expires in {d} day(s) ({exp})"

    body = (
        f"Hello {record.get('name', 'Driver')},\n\n"
        f"This is an automated reminder from TransitOps.\n\n"
        f"Your driving licence {headline}.\n\n"
        f"    Licence number : {record.get('license_no', 'N/A')}\n"
        f"    Expiry date    : {exp}\n\n"
        f"Please renew it before it expires to stay eligible for trip assignments.\n\n"
        f"— TransitOps Fleet Operations"
    )
    return subject, body


def send_email(to_addr, subject, body):
    msg = EmailMessage()
    msg["From"] = GMAIL_USER
    msg["To"] = to_addr
    if ADMIN_EMAIL:
        msg["Cc"] = ADMIN_EMAIL
    msg["Subject"] = subject
    msg.set_content(body)

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
        server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
        server.send_message(msg)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Send licence-expiry email reminders.")
    parser.add_argument("--dry-run", action="store_true", help="show who would be emailed; send nothing")
    parser.add_argument("--send-now", action="store_true", help="email everyone due now, ignoring the 7-day skip")
    parser.add_argument("--days", type=int, default=DEFAULT_WINDOW_DAYS, help="expiring-soon window in days")
    parser.add_argument("--file", default=LICENSES_FILE, help="path to the licences JSON")
    args = parser.parse_args()

    today = date.today()
    records = load_licenses(args.file)

    # Pick who to email
    due = [r for r in records if is_due(r, today, args.days)]
    if not args.send_now:          # automatic mode also skips the recently-reminded
        due = [r for r in due if not recently_reminded(r, today)]

    mode = "DRY RUN" if args.dry_run else ("SEND NOW" if args.send_now else "AUTOMATIC")
    print(f"\n📋 License reminder — {mode}  (window: {args.days} days, today: {today})")
    print(f"   {len(due)} of {len(records)} licence(s) need a reminder.\n")

    if not due:
        print("   Nothing to send. ✅\n")
        return

    # Credentials are only needed when we actually send
    if not args.dry_run and (not GMAIL_USER or not GMAIL_APP_PASSWORD):
        print("❌ GMAIL_USER / GMAIL_APP_PASSWORD are missing in your .env file.")
        print("   Add them (see the top of this file) or use --dry-run to preview.\n")
        return

    sent = 0
    for r in due:
        d = days_left(r, today)
        status = "EXPIRED" if d < 0 else f"{d}d left"
        subject, body = build_message(r, today)
        if args.dry_run:
            print(f"   • would email {r['name']:<18} <{r['email']}>  ({status})")
            continue
        try:
            send_email(r["email"], subject, body)
            r["last_reminded"] = today.isoformat()
            sent += 1
            print(f"   ✉️  sent to {r['name']:<18} <{r['email']}>  ({status})")
        except Exception as e:
            print(f"   ❌ failed for {r['name']} <{r['email']}>: {e}")

    if not args.dry_run:
        save_licenses(records, args.file)
        print(f"\n   Done — {sent} email(s) sent.\n")
    else:
        print("\n   (dry run — no emails sent)\n")


if __name__ == "__main__":
    main()
