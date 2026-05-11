from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr


class OTPRequest(BaseModel):
    phone_number: str


class OTPRequestResponse(BaseModel):
    message: str
    phone_number: str
    dev_otp: str
    expires_at: datetime


class OTPVerifyRequest(BaseModel):
    phone_number: str
    otp_code: str
    device_id: Optional[str] = None


class UserAuthResponse(BaseModel):
    id: UUID
    phone_number: str
    is_verified: bool
    created_at: datetime
    last_active: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserAuthResponse


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


class AdminAuthResponse(BaseModel):
    id: UUID
    email: EmailStr
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin: AdminAuthResponse