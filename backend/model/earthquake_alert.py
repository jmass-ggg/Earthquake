import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from backend.database import Base


class EarthquakeAlert(Base):
    __tablename__ = "earthquake_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=True)
    message = Column(Text, nullable=True)
    magnitude = Column(Numeric(3, 1), nullable=True)
    latitude = Column(Numeric(10, 7), nullable=True)
    longitude = Column(Numeric(10, 7), nullable=True)
    risk_level = Column(String(20), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("admins.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    admin = relationship("Admin", back_populates="earthquake_alerts")
    notifications = relationship("Notification", back_populates="alert")