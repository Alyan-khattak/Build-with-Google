from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from ..database import get_db
from ..models.user import User
from ..models.guardian_link import GuardianLink
from ..models.guardian_contact import GuardianContact
from ..security.auth import get_current_user, hash_password, verify_password

router = APIRouter(prefix="/api/v1/users", tags=["users"])


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class GuardianLinkRequest(BaseModel):
    guardian_email: str


class GuardianInfo(BaseModel):
    link_id: str
    email: str
    full_name: Optional[str]
    status: str


class ProtegeeInfo(BaseModel):
    link_id: str
    email: str
    full_name: Optional[str]
    status: str


@router.get("/me")
def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "created_at": current_user.created_at.isoformat(),
    }


@router.patch("/me")
def update_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    db.commit()
    return {"id": current_user.id, "email": current_user.email, "full_name": current_user.full_name, "role": current_user.role}


@router.post("/me/password")
def change_password(
    payload: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=422, detail="New password must be at least 8 characters")
    current_user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password updated"}


@router.get("/me/guardians")
def list_my_guardians(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    links = db.query(GuardianLink).filter(
        GuardianLink.owner_user_id == current_user.id,
        GuardianLink.status == "active",
    ).all()
    result = []
    for link in links:
        guardian = db.get(User, link.guardian_user_id)
        if guardian:
            result.append({"link_id": link.id, "email": guardian.email, "full_name": guardian.full_name, "status": link.status})
    return result


@router.post("/me/guardians", status_code=201)
def add_guardian(
    payload: GuardianLinkRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "woman":
        raise HTTPException(status_code=403, detail="Only safety users can add guardians")
    guardian = db.query(User).filter(
        User.email == payload.guardian_email, User.role == "guardian", User.is_active == True
    ).first()
    if not guardian:
        raise HTTPException(status_code=404, detail="No guardian account found with that email")
    existing = db.query(GuardianLink).filter(
        GuardianLink.owner_user_id == current_user.id,
        GuardianLink.guardian_user_id == guardian.id,
        GuardianLink.status == "active",
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Guardian already linked")
    link = GuardianLink(owner_user_id=current_user.id, guardian_user_id=guardian.id, status="active")
    db.add(link)
    db.commit()
    db.refresh(link)
    return {"link_id": link.id, "email": guardian.email, "full_name": guardian.full_name, "status": link.status}


@router.delete("/me/guardians/{link_id}", status_code=204)
def remove_guardian(
    link_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    link = db.query(GuardianLink).filter(
        GuardianLink.id == link_id,
        GuardianLink.owner_user_id == current_user.id,
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Guardian link not found")
    from datetime import datetime, timezone
    link.status = "revoked"
    link.revoked_at = datetime.now(timezone.utc)
    db.commit()


@router.get("/me/guardian-contacts")
def list_guardian_contacts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Email-only guardian contacts — no account required."""
    contacts = db.query(GuardianContact).filter_by(owner_user_id=current_user.id).all()
    return [{"id": c.id, "email": c.email, "label": c.label} for c in contacts]


@router.post("/me/guardian-contacts", status_code=201)
def add_guardian_contact(
    payload: GuardianLinkRequest,  # reuse — just has guardian_email
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "woman":
        raise HTTPException(status_code=403, detail="Only safety users can add guardian contacts")
    existing = db.query(GuardianContact).filter_by(
        owner_user_id=current_user.id, email=payload.guardian_email
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Contact already added")
    contact = GuardianContact(owner_user_id=current_user.id, email=payload.guardian_email)
    db.add(contact)
    db.commit()
    db.refresh(contact)
    # Also auto-link as guardian account if one exists
    guardian = db.query(User).filter(
        User.email == payload.guardian_email, User.role == "guardian", User.is_active == True
    ).first()
    if guardian:
        link_exists = db.query(GuardianLink).filter_by(
            owner_user_id=current_user.id, guardian_user_id=guardian.id, status="active"
        ).first()
        if not link_exists:
            db.add(GuardianLink(owner_user_id=current_user.id, guardian_user_id=guardian.id, status="active"))
            db.commit()
    return {"id": contact.id, "email": contact.email, "label": contact.label}


@router.delete("/me/guardian-contacts/{contact_id}", status_code=204)
def remove_guardian_contact(
    contact_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contact = db.query(GuardianContact).filter_by(
        id=contact_id, owner_user_id=current_user.id
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(contact)
    db.commit()


@router.get("/me/proteges")
def list_my_proteges(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """For guardians: list who they are protecting."""
    links = db.query(GuardianLink).filter(
        GuardianLink.guardian_user_id == current_user.id,
        GuardianLink.status == "active",
    ).all()
    result = []
    for link in links:
        owner = db.get(User, link.owner_user_id)
        if owner:
            result.append({"link_id": link.id, "email": owner.email, "full_name": owner.full_name, "status": link.status})
    return result
