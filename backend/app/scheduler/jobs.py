"""
APScheduler job functions — must be module-level for pickling.
Each function creates its own DB session and closes it when done.
"""
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)


def process_check_due(check_id: str) -> None:
    """Mark a check as pending when its due time arrives."""
    from ..database import SessionLocal
    from ..models.safety_check import SafetyCheck

    db = SessionLocal()
    try:
        check = db.get(SafetyCheck, check_id)
        if check is None:
            logger.warning("process_check_due: check %s not found", check_id)
            return
        if check.status != "scheduled":
            # Already processed (answered or expired from a previous run)
            return
        check.status = "pending"
        db.commit()
        logger.info("Check %s is now pending", check_id)
    except Exception:
        db.rollback()
        logger.exception("Error in process_check_due for %s", check_id)
    finally:
        db.close()


def process_check_deadline(check_id: str) -> None:
    """
    Fired at response_deadline: if the check is still pending → trigger emergency.
    Idempotent — won't create a duplicate emergency if one already exists for the session.
    """
    from ..database import SessionLocal
    from ..models.safety_check import SafetyCheck
    from ..models.safety_session import SafetySession
    from ..services.emergency_service import escalate_to_emergency

    db = SessionLocal()
    try:
        check = db.get(SafetyCheck, check_id)
        if check is None:
            logger.warning("process_check_deadline: check %s not found", check_id)
            return
        if check.status != "pending":
            # Already answered or already processed
            return

        check.status = "expired"
        check.processed_at = datetime.now(timezone.utc)
        db.flush()

        session = db.get(SafetySession, check.session_id)
        if session and session.status == "active":
            escalate_to_emergency(db, session, trigger_reason="missed")
            logger.info("Emergency created for session %s (missed check %s)", session.id, check_id)

        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Error in process_check_deadline for %s", check_id)
    finally:
        db.close()
