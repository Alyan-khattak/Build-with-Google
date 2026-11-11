"""
On startup: reconcile active sessions — process overdue checks,
reschedule still-future checks whose jobs may have been lost.
APScheduler with SQLiteJobStore recovers jobs automatically; this
handles the edge case where the job store itself was cleared or corrupted.
"""
from datetime import datetime, timezone
import logging
from sqlalchemy.orm import Session
from ..models.safety_session import SafetySession
from ..models.safety_check import SafetyCheck

logger = logging.getLogger(__name__)


def _utc(dt: datetime) -> datetime:
    """Ensure datetime is timezone-aware UTC (SQLite may return naive datetimes)."""
    if dt is None:
        return dt
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def reconcile_active_sessions(db: Session) -> None:
    now = datetime.now(timezone.utc)
    active_sessions = db.query(SafetySession).filter_by(status="active").all()

    if not active_sessions:
        return

    logger.info("Reconciling %d active session(s) on startup", len(active_sessions))

    from . import scheduler
    from .jobs import process_check_due, process_check_deadline
    from ..services.emergency_service import escalate_to_emergency

    for session in active_sessions:
        checks = (
            db.query(SafetyCheck)
            .filter(
                SafetyCheck.session_id == session.id,
                SafetyCheck.status.in_(["scheduled", "pending"]),
            )
            .order_by(SafetyCheck.sequence_number)
            .all()
        )

        for check in checks:
            due = _utc(check.due_at)
            deadline = _utc(check.response_deadline)

            if check.status in ("pending", "scheduled") and deadline <= now:
                # Deadline (and due) already passed while we were down — escalate now
                check.status = "expired"
                check.processed_at = now
                escalate_to_emergency(db, session, trigger_reason="missed")
                logger.info("Reconcile: session %s check %s escalated (deadline passed)", session.id, check.id)

            elif check.status == "scheduled" and due <= now < deadline:
                # Due time passed but deadline hasn't — mark pending, reschedule deadline
                check.status = "pending"
                _ensure_job(scheduler, f"deadline_{check.id}", process_check_deadline, deadline, [check.id])

            elif check.status == "scheduled" and due > now:
                # Still in the future — ensure job exists
                _ensure_job(scheduler, f"due_{check.id}", process_check_due, due, [check.id])
                _ensure_job(scheduler, f"deadline_{check.id}", process_check_deadline, deadline, [check.id])

    db.commit()


def _ensure_job(scheduler, job_id: str, func, run_date, args: list) -> None:
    """Add a one-shot job only if it doesn't already exist in the job store."""
    if scheduler.get_job(job_id) is None:
        scheduler.add_job(
            func,
            trigger="date",
            run_date=run_date,
            args=args,
            id=job_id,
            replace_existing=True,
            misfire_grace_time=120,
        )
