"""Central configuration — reads from the repo-root .env so the OCR key and
Gmail credentials you already set up are reused as-is."""
import os
from pathlib import Path
from dotenv import load_dotenv

# backend/app/config.py -> repo root is three parents up
REPO_ROOT = Path(__file__).resolve().parents[3]
BACKEND_DIR = Path(__file__).resolve().parents[1]

# Load the existing .env at the repo root (OCR_SPACE_API_KEY, GMAIL_USER, ...)
load_dotenv(REPO_ROOT / ".env")

# --- App ---
APP_NAME = "TransitOps"
SECRET_KEY = os.getenv("TRANSITOPS_SECRET", "change-me-in-production-transitops-2026")
ACCESS_TOKEN_EXPIRE_HOURS = 12

# --- Database (SQLite, zero-config) ---
DB_PATH = BACKEND_DIR / "transitops.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")

# --- Uploaded documents ---
UPLOAD_DIR = BACKEND_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# --- OCR (reuses your existing key) ---
OCR_SPACE_API_KEY = (os.getenv("OCR_SPACE_API_KEY") or "").strip().strip('"').strip("'")
OCR_SPACE_URL = "https://api.ocr.space/parse/image"

# --- Email reminders (reuses your existing Gmail app password) ---
GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")

# "expiring soon" window for licence reminders
REMINDER_WINDOW_DAYS = 30
