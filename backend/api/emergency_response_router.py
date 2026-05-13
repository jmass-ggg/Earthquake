from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.api.auth_dependency import get_current_user
from backend.database import get_db
from backend.model.earthquake_alert import Alert
from backend.model.emergency_response import EmergencyResponse
from backend.model.user import User
from backend.service.websocket_manager import manager

router = APIRouter(
    prefix="/emergency",
    tags=["Emergency Response"],
)


class EmergencyResponseCreate(BaseModel):
    alert_id: str
    response: Literal["SAFE", "NEED_HELP"]
    latitude: Optional[float] = None
    longitude: Optional[float] = None


@router.post("/respond")
async def respond_to_emergency(
    payload: EmergencyResponseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        alert_uuid = UUID(str(payload.alert_id))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid alert id",
        )

    alert = db.query(EarthquakeAlert).filter(
        EarthquakeAlert.id == alert_uuid
    ).first()

    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found",
        )

    existing = db.query(EmergencyResponse).filter(
        EmergencyResponse.alert_id == alert_uuid,
        EmergencyResponse.user_id == current_user.id,
    ).first()

    if existing:
        existing.response = payload.response
        existing.latitude = payload.latitude
        existing.longitude = payload.longitude
        existing.responded_at = datetime.utcnow()
    else:
        response = EmergencyResponse(
            alert_id=alert_uuid,
            user_id=current_user.id,
            response=payload.response,
            latitude=payload.latitude,
            longitude=payload.longitude,
        )
        db.add(response)

    db.commit()

    await manager.broadcast(
        {
            "type": "EMERGENCY_RESPONSE",
            "alert_id": str(alert_uuid),
            "user_id": str(current_user.id),
            "phone_number": current_user.phone_number,
            "response": payload.response,
            "latitude": payload.latitude,
            "longitude": payload.longitude,
            "responded_at": datetime.utcnow().isoformat(),
        }
    )

    return {
        "message": "Emergency response saved",
        "response": payload.response,
    }