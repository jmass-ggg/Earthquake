import uuid
import enum
from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    UniqueConstraint,
    Enum,
)
from sqlalchemy.dialects.postgresql import UUID

from backend.database import Base


class ResponseStatus(str, enum.Enum):
    SAFE = "safe"
    NOT_SAFE = "not_safe"
    NEED_HELP = "need_help"


class EmergencyResponse(Base):
    __tablename__ = "emergency_responses"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    alert_id = Column(
        UUID(as_uuid=True),
        ForeignKey("alerts.id"),
        nullable=False,
    )

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    response = Column(
        Enum(ResponseStatus, name="responsestatus"),
        nullable=False,
    )

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    responded_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    