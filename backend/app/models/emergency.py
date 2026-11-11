from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime, timezone
from ..database import Base
import uuid


class Emergency(Base):
    __tablename__ = "emergencies"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(String, ForeignKey("safety_sessions.id"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default="active")  # active | resolved
    trigger_reason: Mapped[str] = mapped_column(String, nullable=False)  # NO | SOS | missed
    triggered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    last_updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    resolution_actor_id: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
