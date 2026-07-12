from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..auth import (create_access_token, hash_password, verify_password,
                    get_current_user, require_roles)
from ..database import get_db
from ..models import User, Role
from ..schemas import LoginRequest, Token, UserCreate, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """OAuth2 password flow. `username` field carries the email."""
    user = db.query(User).filter(User.email == form.username.lower().strip()).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(401, "Incorrect email or password.")
    if not user.is_active:
        raise HTTPException(403, "This account is disabled.")
    token = create_access_token(user)
    return Token(access_token=token, role=user.role, name=user.name, email=user.email)


@router.post("/login-json", response_model=Token)
def login_json(body: LoginRequest, db: Session = Depends(get_db)):
    """Convenience JSON login for the frontend fetch() call."""
    user = db.query(User).filter(User.email == body.email.lower().strip()).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Incorrect email or password.")
    token = create_access_token(user)
    return Token(access_token=token, role=user.role, name=user.name, email=user.email)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db),
               _: User = Depends(require_roles(Role.ADMIN))):
    return db.query(User).all()


@router.post("/users", response_model=UserOut)
def create_user(body: UserCreate, db: Session = Depends(get_db),
                _: User = Depends(require_roles(Role.ADMIN))):
    if body.role not in Role.ALL:
        raise HTTPException(400, f"Role must be one of {Role.ALL}.")
    if db.query(User).filter(User.email == body.email.lower().strip()).first():
        raise HTTPException(400, "A user with that email already exists.")
    user = User(name=body.name, email=body.email.lower().strip(),
                password_hash=hash_password(body.password), role=body.role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
