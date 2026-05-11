from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, status

from backend.api.auth_dependency import get_current_admin
from backend.database import get_db
from backend.model.admin import Admin
from backend.model.earthquake_alert import EarthquakeAlert
from backend.model.push_subscription import PushSubscription
from backend.service.websocket_manager import manager
from backend.service.push_service import send_web_push
from backend.service.alert_reminder_scheduler import schedule_hourly_alert_reminder

router = APIRouter(
    prefix="/admin",
    tags=["Admin Alerts"],
)


class EarthquakeAlertCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1)
    magnitude: float = Field(..., ge=0)
    risk_level: str = Field(..., min_length=1, max_length=20)


class EarthquakeAlertResponse(BaseModel):
    id: str
    title: str
    message: str
    magnitude: float
    risk_level: str
    emergency: bool = True


@router.post(
    "/send-alert",
    response_model=EarthquakeAlertResponse,
    status_code=status.HTTP_201_CREATED,
)
async def send_earthquake_alert(
    payload: EarthquakeAlertCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    alert = EarthquakeAlert(
        title=payload.title,
        message=payload.message,
        magnitude=payload.magnitude,
        risk_level=payload.risk_level,
        created_by=current_admin.id,
    )

    db.add(alert)
    db.commit()
    db.refresh(alert)

    websocket_payload = {
        "type": "EARTHQUAKE_ALERT",
        "alert_id": str(alert.id),
        "title": alert.title,
        "message": alert.message,
        "magnitude": float(alert.magnitude),
        "risk_level": alert.risk_level,
        "emergency": True,
        "open_url": "/emergency",
        "alarm": True,
        "vibration": True,
        "requires_response": True,
        "response_options": ["SAFE", "NEED_HELP"],
    }

    await manager.broadcast(websocket_payload)

    push_payload = {
        "type": "EARTHQUAKE_ALERT",
        "alert_id": str(alert.id),
        "title": alert.title,
        "body": alert.message,
        "message": alert.message,
        "magnitude": float(alert.magnitude),
        "risk_level": alert.risk_level,
        "emergency": True,
        "open_url": "/emergency",
        "alarm": True,
        "vibration": True,
        "requires_response": True,
        "response_options": ["SAFE", "NEED_HELP"],
    }

    subscriptions = db.query(PushSubscription).all()

    sent_count = 0

    for sub in subscriptions:
        success = send_web_push(
            subscription=sub.subscription_json,
            payload=push_payload,
        )

        if success:
            sent_count += 1

    # This starts the 1-hour repeated alarm reminder.
    # It will send again every 1 hour until the user responds SAFE.
    schedule_hourly_alert_reminder(str(alert.id))

    return {
        "id": str(alert.id),
        "title": alert.title,
        "message": alert.message,
        "magnitude": float(alert.magnitude),
        "risk_level": alert.risk_level,
        "emergency": True,
    }