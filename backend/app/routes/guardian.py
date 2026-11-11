"""
Guardian dashboard endpoints — read-only access to emergencies
for accounts that are linked as a guardian.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..models.guardian_link import GuardianLink
from ..models.emergency import Emergency
from ..models.safety_session import SafetySession
from ..models.notification import Notification
from ..schemas.session import GuardianAlertResponse
from ..security.auth import get_current_user, require_role

router = APIRouter(prefix="/api/v1/guardian", tags=["guardian"])


@router.get("/alerts", response_model=list[GuardianAlertResponse])
def get_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return active emergencies with user email and location for all guarded users."""
    if current_user.role != "guardian":
        raise HTTPException(status_code=403, detail="Guardian role required")

    links = db.query(GuardianLink).filter_by(
        guardian_user_id=current_user.id, status="active"
    ).all()
    if not links:
        return []

    owner_ids = [link.owner_user_id for link in links]
    owners_by_id = {
        u.id: u for u in db.query(User).filter(User.id.in_(owner_ids)).all()
    }

    sessions = db.query(SafetySession).filter(
        SafetySession.user_id.in_(owner_ids),
        SafetySession.status.in_(["emergency", "active"]),
    ).all()
    if not sessions:
        return []

    sessions_by_id = {s.id: s for s in sessions}
    session_ids = list(sessions_by_id.keys())

    emergencies = db.query(Emergency).filter(
        Emergency.session_id.in_(session_ids),
        Emergency.status == "active",
    ).all()

    result = []
    for em in emergencies:
        sess = sessions_by_id.get(em.session_id)
        owner = owners_by_id.get(sess.user_id) if sess else None
        result.append(GuardianAlertResponse(
            id=em.id,
            session_id=em.session_id,
            status=em.status,
            trigger_reason=em.trigger_reason,
            triggered_at=em.triggered_at,
            last_updated_at=em.last_updated_at,
            resolved_at=em.resolved_at,
            user_email=owner.email if owner else "unknown",
            latitude=sess.latitude if sess else None,
            longitude=sess.longitude if sess else None,
        ))
    return result


@router.post("/alerts/{emergency_id}/acknowledge")
def acknowledge_alert(
    emergency_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a notification as acknowledged (does not resolve the emergency)."""
    if current_user.role != "guardian":
        raise HTTPException(status_code=403, detail="Guardian role required")

    notif = db.query(Notification).filter_by(
        emergency_id=emergency_id,
        recipient_id=current_user.id,
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    from datetime import datetime, timezone
    notif.status = "acknowledged"
    notif.acknowledged_at = datetime.now(timezone.utc)
    db.commit()
    return {"acknowledged": True}
