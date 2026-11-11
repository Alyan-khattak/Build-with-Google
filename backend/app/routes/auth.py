from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..models.guardian_link import GuardianLink
from ..models.guardian_contact import GuardianContact
from ..schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from ..security.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        full_name=payload.full_name,
        is_active=True,
    )
    db.add(user)
    db.flush()  # get user.id before commit

    # Store guardian email contact (no account required) and auto-link if account exists
    if payload.role == "woman" and payload.guardian_email:
        db.add(GuardianContact(owner_user_id=user.id, email=payload.guardian_email))
        guardian = db.query(User).filter(
            User.email == payload.guardian_email, User.role == "guardian", User.is_active == True
        ).first()
        if guardian:
            db.add(GuardianLink(owner_user_id=user.id, guardian_user_id=guardian.id, status="active"))

    db.commit()
    db.refresh(user)
    token = create_access_token(user.id, user.role)
    return TokenResponse(access_token=token, role=user.role)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email, User.is_active == True).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    token = create_access_token(user.id, user.role)
    return TokenResponse(access_token=token, role=user.role)


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user
