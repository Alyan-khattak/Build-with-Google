"""
Emergency creation — idempotent per session.
Repeated missed checks update the existing active emergency record.
"""
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from ..models.emergency import Emergency
from ..models.notification import Notification
from ..models.safety_session import SafetySession
from ..models.guardian_link import GuardianLink


def escalate_to_emergency(
    db: Session,
    session: SafetySession,
    trigger_reason: str,  # "NO" | "SOS" | "missed"
) -> Emergency:
    now = datetime.now(timezone.utc)

    # Idempotent: one active emergency per session — repeated missed checks update it
    existing = (
        db.query(Emergency)
        .filter_by(session_id=session.id, status="active")
        .first()
    )
    if existing:
        existing.last_updated_at = now
        db.flush()
        return existing

    emergency = Emergency(
        session_id=session.id,
        status="active",
        trigger_reason=trigger_reason,
        triggered_at=now,
        last_updated_at=now,
    )
    db.add(emergency)
    db.flush()  # get emergency.id before creating notifications

    session.status = "emergency"

    # Notify all active guardians via in-app notification
    guardian_links = (
        db.query(GuardianLink)
        .filter_by(owner_user_id=session.user_id, status="active")
        .all()
    )
    guardian_user_ids = []
    for link in guardian_links:
        db.add(Notification(
            emergency_id=emergency.id,
            recipient_id=link.guardian_user_id,
            channel="in_app",
            status="queued",
        ))
        guardian_user_ids.append(link.guardian_user_id)

    db.flush()

    # Send email notifications (non-blocking — failure must never stop the emergency)
    _send_guardian_emails(db, session, emergency, guardian_user_ids, trigger_reason)

    return emergency


def _send_guardian_emails(
    db: Session,
    session: SafetySession,
    emergency,
    guardian_user_ids: list,
    trigger_reason: str,
) -> None:
    from .email_service import send_emergency_email
    from ..models.user import User
    from ..models.guardian_contact import GuardianContact

    owner = db.get(User, session.user_id)
    if not owner:
        return

    # Email guardian accounts (in-app links)
    emailed: set[str] = set()
    for gid in guardian_user_ids:
        guardian = db.get(User, gid)
        if guardian:
            send_emergency_email(
                guardian_email=guardian.email,
                user_email=owner.email,
                trigger_reason=trigger_reason,
                latitude=session.latitude,
                longitude=session.longitude,
            )
            emailed.add(guardian.email)

    # Also email guardian contacts who have no registered account
    contacts = db.query(GuardianContact).filter_by(owner_user_id=session.user_id).all()
    for contact in contacts:
        if contact.email not in emailed:
            send_emergency_email(
                guardian_email=contact.email,
                user_email=owner.email,
                trigger_reason=trigger_reason,
                latitude=session.latitude,
                longitude=session.longitude,
            )
            emailed.add(contact.email)


def resolve_emergency(db: Session, emergency: Emergency, actor_id: str) -> Emergency:
    now = datetime.now(timezone.utc)
    emergency.status = "resolved"
    emergency.resolved_at = now
    emergency.resolution_actor_id = actor_id
    emergency.last_updated_at = now

    session = db.get(SafetySession, emergency.session_id)
    if session:
        session.status = "ended"
        session.ended_at = now

    db.flush()
    return emergency
