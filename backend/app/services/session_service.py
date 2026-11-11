"""
Safety session management — start, respond, end.
"""
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session as DbSession
from ..models.safety_session import SafetySession
from ..models.safety_check import SafetyCheck
from ..config import settings


def _check_due_at(started_at: datetime, seq: int) -> datetime:
    """
    Compute anchored check time.
    seq=1 → started_at + first_check_minutes
    seq=2 → started_at + first_check_minutes + interval
    seq=N → started_at + first_check_minutes + (N-1) * interval
    """
    offset = timedelta(minutes=settings.first_check_minutes) + timedelta(
        minutes=settings.check_interval_minutes * (seq - 1)
    )
    return started_at + offset


def start_session(
    db: DbSession,
    user_id: str,
    latitude: float | None = None,
    longitude: float | None = None,
) -> SafetySession:
    now = datetime.now(timezone.utc)

    session = SafetySession(
        user_id=user_id,
        session_type="manual",
        status="active",
        started_at=now,
        latitude=latitude,
        longitude=longitude,
    )
    db.add(session)
    db.flush()  # get session.id

    _schedule_all_checks(db, session)
    db.commit()
    return session


def _schedule_all_checks(db: DbSession, session: SafetySession) -> None:
    from ..scheduler import scheduler
    from ..scheduler.jobs import process_check_due, process_check_deadline

    for seq in range(1, settings.max_checks_per_session + 1):
        due_at = _check_due_at(session.started_at, seq)
        deadline = due_at + timedelta(seconds=settings.response_window_seconds)

        check = SafetyCheck(
            session_id=session.id,
            sequence_number=seq,
            due_at=due_at,
            response_deadline=deadline,
            status="scheduled",
        )
        db.add(check)
        db.flush()

        # Schedule APScheduler jobs (date = fire once at the given time)
        scheduler.add_job(
            process_check_due,
            trigger="date",
            run_date=due_at,
            args=[check.id],
            id=f"due_{check.id}",
            replace_existing=True,
            misfire_grace_time=120,
        )
        scheduler.add_job(
            process_check_deadline,
            trigger="date",
            run_date=deadline,
            args=[check.id],
            id=f"deadline_{check.id}",
            replace_existing=True,
            misfire_grace_time=120,
        )


def respond_to_check(db: DbSession, check: SafetyCheck, response: str, session: SafetySession) -> None:
    """
    Process a user's check-in response.
    YES  → mark answered, session continues.
    NO / SOS → mark answered, escalate immediately.
    """
    from ..services.emergency_service import escalate_to_emergency
    from ..scheduler import scheduler

    now = datetime.now(timezone.utc)
    check.response = response
    check.responded_at = now
    check.status = "answered"

    # Cancel deadline job — response arrived before it fired
    try:
        scheduler.remove_job(f"deadline_{check.id}")
    except Exception:
        pass  # job may have already fired; that's fine

    if response in ("NO", "SOS"):
        escalate_to_emergency(db, session, trigger_reason=response)


def end_session(db: DbSession, session: SafetySession, user_id: str) -> None:
    """Cancel all pending scheduler jobs for this session and mark it ended."""
    from ..scheduler import scheduler
    from ..models.emergency import Emergency

    now = datetime.now(timezone.utc)
    session.status = "ended"
    session.ended_at = now

    # Resolve any active emergency for this session
    active_emergency = db.query(Emergency).filter_by(session_id=session.id, status="active").first()
    if active_emergency:
        active_emergency.status = "resolved"
        active_emergency.resolved_at = now
        active_emergency.last_updated_at = now
        active_emergency.resolution_actor_id = user_id

    # Cancel all future scheduled jobs for this session's checks
    checks = db.query(SafetyCheck).filter_by(session_id=session.id).all()
    for check in checks:
        for prefix in ("due_", "deadline_"):
            try:
                scheduler.remove_job(f"{prefix}{check.id}")
            except Exception:
                pass
        if check.status == "scheduled":
            check.status = "expired"

    db.flush()
