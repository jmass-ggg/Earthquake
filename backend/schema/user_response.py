from uuid import UUID
from typing import Optional

from pydantic import BaseModel

from backend.model.emergency_response import ResponseStatus


class EmergencyResponseCreate(BaseModel):
    alert_id: UUID
    response: ResponseStatus
    latitude: Optional[float] = None
    longitude: Optional[float] = None