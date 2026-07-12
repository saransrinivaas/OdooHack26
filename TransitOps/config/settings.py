"""
settings.py
------------
Global application settings.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------
# Application
# ---------------------------------------------------

APP_NAME = "TransitOPS"

APP_TITLE = "Smart Transport Operations Platform"

APP_VERSION = "1.0.0"

PAGE_ICON = "🚛"

LAYOUT = "wide"

# ---------------------------------------------------
# Supabase
# ---------------------------------------------------

SUPABASE_URL = os.getenv("SUPABASE_URL")

SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# ---------------------------------------------------
# Session
# ---------------------------------------------------

SESSION_USER_KEY = "user"

SESSION_LOGGED_IN = "logged_in"

SESSION_REMEMBER_ME = "remember_me"

# ---------------------------------------------------
# Authentication
# ---------------------------------------------------

LOGIN_TITLE = "Sign In"

FORGOT_PASSWORD_TEXT = "Forgot Password?"

REMEMBER_ME_TEXT = "Remember Me"

# ---------------------------------------------------
# Dashboard
# ---------------------------------------------------

DEFAULT_REDIRECT_PAGE = "login"

# ---------------------------------------------------
# Misc
# ---------------------------------------------------

DATE_FORMAT = "%d-%m-%Y"

TIME_FORMAT = "%H:%M:%S"
