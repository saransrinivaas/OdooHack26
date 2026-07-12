"""Authentication + Role-Based Access Control.

- Passwords: PBKDF2-HMAC-SHA256 (stdlib only, no bcrypt build headaches).
- Tokens:    JWT (PyJWT), signed with SECRET_KEY.
- RBAC:      `require_roles(...)` dependency factory; Admin passes everything.
"""
import hashlib
import hmac
import os
from datetime import datetime, timedelta

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from .config import SECRET_KEY, ACCESS_TOKEN_EXPIRE_HOURS
from .database import get_db
from .models import User, Role

ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


# --- Passwords -------------------------------------------------------------
def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)
    return f"{salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt_hex, digest_hex = stored.split("$", 1)
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(digest_hex)
    except (ValueError, AttributeError):
        return False
    test = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)
    return hmac.compare_digest(test, expected)


# --- Tokens ----------------------------------------------------------------
def create_access_token(user: User) -> str:
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "name": user.name,
        "exp": datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# --- Current-user dependencies --------------------------------------------
def get_current_user(token: str = Depends(oauth2_scheme),
                     db: Session = Depends(get_db)) -> User:
    creds_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise creds_error
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except (jwt.PyJWTError, TypeError, ValueError):
        raise creds_error
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise creds_error
    return user


def require_roles(*roles):
    """Dependency factory: allow only the given roles (Admin always allowed)."""
    allowed = set(roles) | {Role.ADMIN}

    def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Your role ({user.role}) is not allowed to perform this action.",
            )
        return user

    return checker
