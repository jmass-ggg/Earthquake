import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    Text,
    Boolean,
    Enum,
)

from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from backend.database import Base


class RiskLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"
    CRITICAL = "critical"

class AlertStatus(str, enum.Enum):
    SAFE = "safe"
    WARNING = "warning"
    DANGER = "danger"
    EVACUATE = "evacuate"

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    title = Column(String(255), nullable=False)

    message = Column(Text, nullable=False)


    alert_type = Column(String(50), nullable=False)


    risk_level = Column(
        Enum(RiskLevel),
        nullable=False
    )

    status = Column(
        Enum(AlertStatus),
        nullable=False,
        default=AlertStatus.SAFE
    )

    magnitude = Column(
        Numeric(3, 1),
        nullable=True
    )

    latitude = Column(
        Numeric(10, 7),
        nullable=True
    )

    longitude = Column(
        Numeric(10, 7),
        nullable=True
    )

    emergency = Column(
        Boolean,
        default=False
    )

    created_by = Column(
        UUID(as_uuid=True),
        ForeignKey("admins.id"),
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    admin = relationship(
        "Admin",
        back_populates="alerts"
    )

    notifications = relationship(
        "Notification",
        back_populates="alert"
    )