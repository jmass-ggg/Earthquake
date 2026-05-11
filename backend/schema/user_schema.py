from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class UserCreate(BaseModel):
    phone_number: str


class UserResponse(BaseModel):
    id: UUID
    phone_number: str
    is_verified: bool
    created_at: datetime
    last_active: Optional[datetime] = None

    class Config:
        from_attributes = True