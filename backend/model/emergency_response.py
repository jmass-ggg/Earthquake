import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from backend.database import Base


class EmergencyResponse(Base):
    __tablename__ = "emergency_responses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    alert_id = Column(
        UUID(as_uuid=True),
        ForeignKey("earthquake_alerts.id"),
        nullable=False,
    )

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    response = Column(String(20), nullable=False)
    # SAFE / NEED_HELP

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    responded_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint(
            "alert_id",
            "user_id",
            name="uq_emergency_response_alert_user",
        ),
    )