from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime, timezone
from ..database import Base
import uuid


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    emergency_id: Mapped[str] = mapped_column(String, ForeignKey("emergencies.id"), nullable=False, index=True)
    recipient_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    channel: Mapped[str] = mapped_column(String, nullable=False, default="in_app")
    status: Mapped[str] = mapped_column(String, nullable=False, default="queued")
    # queued | delivered | acknowledged
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
