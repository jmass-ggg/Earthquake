import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Boolean,
)

from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from backend.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )


    alert_id = Column(
        UUID(as_uuid=True),
        ForeignKey("alerts.id"),
        nullable=False
    )


    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )

    is_sent = Column(
        Boolean,
        default=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


    alert = relationship(
        "Alert",
        back_populates="notifications"
    )

    user = relationship(
        "User",
        back_populates="notifications"
    )