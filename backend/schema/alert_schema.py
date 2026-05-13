from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, status

from datetime import datetime

from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, status

from backend.api.auth_dependency import get_current_admin
from backend.database import get_db

from backend.model.admin import Admin
from backend.model.user import User
from backend.model.earthquake_alert import Alert, RiskLevel, AlertStatus
from backend.model.notification import Notification
from backend.model.push_subscription import PushSubscription

from backend.service.push_service import send_web_push
from backend.service.alert_reminder_scheduler import schedule_hourly_alert_reminder
from backend.websocket.manager import manager



# -----------------------
# REQUEST MODEL
# -----------------------

class EarthquakeAlertCreate(BaseModel):
    title: str
    message: str
    alert_type: str

    status: AlertStatus
    risk_level: RiskLevel

    magnitude: float | None = None
    emergency: bool = True


# -----------------------
# RESPONSE MODEL
# -----------------------
class EarthquakeAlertResponse(BaseModel):
    id: str
    title: str
    message: str
    magnitude: float | None
    risk_level: str
    emergency: bool
