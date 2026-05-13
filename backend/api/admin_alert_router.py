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


router = APIRouter(
    prefix="/admin",
    tags=["Admin Alerts"],
)


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
    sent_count: int


# -----------------------
# CREATE ALERT
# -----------------------
@router.post(
    "/send-alert",
    response_model=EarthquakeAlertResponse,
    status_code=status.HTTP_201_CREATED,
)
async def send_alert(
    payload: EarthquakeAlertCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    # 1. Save alert
    alert = Alert(
        title=payload.title,
        message=payload.message,
        alert_type=payload.alert_type,
        magnitude=payload.magnitude,
        risk_level=payload.risk_level,
        status=payload.status,
        emergency=payload.emergency,
        created_by=current_admin.id,
    )

    db.add(alert)
    db.commit()
    db.refresh(alert)

    # 2. Create notifications (ONE per alert per user)
    users = db.query(User).all()

    for user in users:
        existing_notification = (
            db.query(Notification)
            .filter(Notification.user_id == user.id)
            .first()
        )

        if existing_notification:
            existing_notification.alert_id = alert.id
            existing_notification.is_sent = True
            existing_notification.created_at = datetime.utcnow()
        else:
            notification = Notification(
                alert_id=alert.id,
                user_id=user.id,
                is_sent=True,
            )
            db.add(notification)

    db.commit()

    # 3. WebSocket broadcast
    websocket_payload = {
        "type": "ALERT",
        "alert_id": str(alert.id),
        "title": alert.title,
        "message": alert.message,
        "magnitude": float(alert.magnitude) if alert.magnitude else None,
        "risk_level": alert.risk_level.value,
        "status": alert.status.value,
        "emergency": alert.emergency,
        "open_url": "/emergency",
        "alarm": True,
        "vibration": True,
        "response_options": ["SAFE", "NEED_HELP"],
    }

    await manager.broadcast(websocket_payload)

    # 4. Push notifications
    push_payload = websocket_payload.copy()
    push_payload["body"] = alert.message

    subscriptions = db.query(PushSubscription).all()

    sent_count = 0

    for sub in subscriptions:
        success = send_web_push(
            subscription=sub.subscription_json,
            payload=push_payload,
        )
        if success:
            sent_count += 1

    # 5. Scheduler
    schedule_hourly_alert_reminder(str(alert.id))

    # 6. Response
    return EarthquakeAlertResponse(
        id=str(alert.id),
        title=alert.title,
        message=alert.message,
        magnitude=float(alert.magnitude) if alert.magnitude else None,
        risk_level=alert.risk_level.value,
        emergency=alert.emergency,
        sent_count=sent_count,
    )