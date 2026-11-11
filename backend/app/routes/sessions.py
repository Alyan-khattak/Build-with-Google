from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..models.safety_session import SafetySession
from ..models.safety_check import SafetyCheck
from ..models.emergency import Emergency
from ..schemas.session import (
    SessionStartRequest, SessionStartResponse, SessionStatusResponse, CheckResponse,
    RespondRequest, EmergencyResponse,
)
from ..security.auth import get_current_user
from ..services.session_service import start_session, respond_to_check, end_session
from ..config import settings

router = APIRouter(prefix="/api/v1/sessions", tags=["sessions"])


@router.post("", response_model=SessionStartResponse, status_code=201)
def create_session(
    payload: SessionStartRequest = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "woman":
        raise HTTPException(status_code=403, detail="Only women accounts can start sessions")

    existing = db.query(SafetySession).filter_by(
        user_id=current_user.id, status="active"
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="A session is already active")

    lat = payload.latitude if payload else None
    lng = payload.longitude if payload else None
    session = start_session(db, current_user.id, latitude=lat, longitude=lng)
    first_check_at = session.started_at + timedelta(minutes=settings.first_check_minutes)
    return SessionStartResponse(
        id=session.id,
        status=session.status,
        started_at=session.started_at,
        first_check_at=first_check_at,
        latitude=session.latitude,
        longitude=session.longitude,
    )


@router.get("/active", response_model=SessionStatusResponse)
def get_active_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(SafetySession).filter(
        SafetySession.user_id == current_user.id,
        SafetySession.status.in_(["active", "emergency"]),
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="No active session")
    return session


@router.get("/{session_id}/checks", response_model=list[CheckResponse])
def get_checks(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = _owned_session(session_id, current_user.id, db)
    checks = (
        db.query(SafetyCheck)
        .filter_by(session_id=session.id)
        .order_by(SafetyCheck.sequence_number)
        .all()
    )
    return checks


@router.get("/{session_id}/checks/current", response_model=CheckResponse)
def get_current_check(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _owned_session(session_id, current_user.id, db)
    check = (
        db.query(SafetyCheck)
        .filter(
            SafetyCheck.session_id == session_id,
            SafetyCheck.status == "pending",
        )
        .order_by(SafetyCheck.sequence_number)
        .first()
    )
    if not check:
        raise HTTPException(status_code=404, detail="No pending check")
    return check


@router.post("/{session_id}/respond")
def respond(
    session_id: str,
    payload: RespondRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.response not in ("YES", "NO", "SOS"):
        raise HTTPException(status_code=422, detail="response must be YES, NO, or SOS")

    session = _owned_session(session_id, current_user.id, db)
    if session.status not in ("active", "emergency"):
        raise HTTPException(status_code=409, detail="Session is not active")

    check = (
        db.query(SafetyCheck)
        .filter(
            SafetyCheck.session_id == session_id,
            SafetyCheck.status == "pending",
        )
        .order_by(SafetyCheck.sequence_number)
        .first()
    )

    if payload.response == "SOS":
        # SOS must never be blocked — escalate immediately regardless of check state
        from ..services.emergency_service import escalate_to_emergency
        from datetime import datetime, timezone as tz
        if check:
            check.response = "SOS"
            check.responded_at = datetime.now(tz.utc)
            check.status = "answered"
            try:
                from ..scheduler import scheduler
                scheduler.remove_job(f"deadline_{check.id}")
            except Exception:
                pass
        escalate_to_emergency(db, session, trigger_reason="SOS")
        db.commit()
        return {"status": "sos_processed", "session_status": "emergency"}

    if not check:
        raise HTTPException(status_code=404, detail="No pending check to respond to")

    respond_to_check(db, check, payload.response, session)
    db.commit()
    return check


@router.post("/{session_id}/end", response_model=SessionStatusResponse)
def end(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = _owned_session(session_id, current_user.id, db)
    if session.status == "ended":
        raise HTTPException(status_code=409, detail="Session already ended")
    end_session(db, session, current_user.id)
    db.commit()
    return session


@router.get("/{session_id}/emergency", response_model=EmergencyResponse)
def get_emergency(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _owned_session(session_id, current_user.id, db)
    emergency = (
        db.query(Emergency)
        .filter_by(session_id=session_id, status="active")
        .first()
    )
    if not emergency:
        raise HTTPException(status_code=404, detail="No active emergency for this session")
    return emergency


def _owned_session(session_id: str, user_id: str, db: Session) -> SafetySession:
    session = db.get(SafetySession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return session
