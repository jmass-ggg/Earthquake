from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, DataError

from backend.model.emergency_response import EmergencyResponse, ResponseStatus
from backend.model.user_location import UserLocation
from backend.model.user import User
from backend.schema.user_response import EmergencyResponseCreate


def create_emergency_response(
    db: Session,
    data: EmergencyResponseCreate,
    user_id,
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise ValueError("User not found")

    existing_response = (
        db.query(EmergencyResponse)
        .filter(
            EmergencyResponse.alert_id == data.alert_id,
            EmergencyResponse.user_id == user_id,
        )
        .first()
    )

    if existing_response:
        raise ValueError("User has already responded to this alert")

    try:
        response_status = (
            data.response
            if isinstance(data.response, ResponseStatus)
            else ResponseStatus(data.response)
        )
    except ValueError:
        raise ValueError("Invalid response. Use: safe, not_safe, or need_help")

    emergency = EmergencyResponse(
        alert_id=data.alert_id,
        user_id=user_id,
        response=response_status,
        latitude=data.latitude,
        longitude=data.longitude,
    )

    db.add(emergency)

    if response_status in [ResponseStatus.NOT_SAFE, ResponseStatus.NEED_HELP]:
        location = UserLocation(
            user_id=user_id,
            latitude=data.latitude,
            longitude=data.longitude,
            emergency_mode=True,
        )
        db.add(location)

    try:
        db.commit()
        db.refresh(emergency)

    except IntegrityError:
        db.rollback()
        raise ValueError(
            "Could not save response. The alert may not exist, or the user already responded."
        )

    except DataError:
        db.rollback()
        raise ValueError("Invalid data format for emergency response")

    return {
        "id": str(emergency.id),
        "alert_id": str(emergency.alert_id),
        "user_id": str(user_id),
        "response": emergency.response.value,
        "latitude": emergency.latitude,
        "longitude": emergency.longitude,
        "phone_number": user.phone_number,
        "responded_at": emergency.responded_at,
    }