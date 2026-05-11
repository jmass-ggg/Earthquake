from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


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
    device_id: str


class UserResponse(BaseModel):
    id: UUID
    phone_number: str
    is_verified: bool

    class Config:
        from_attributes = True


class UserLoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: UserResponse

class AdminLoginRequest(BaseModel):
    email: str
    password: str


class AdminResponse(BaseModel):
    id: UUID
    email: str
    role: str

    class Config:
        from_attributes = True


class AdminLoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    admin: AdminResponse


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class RefreshTokenResponse(BaseModel):
    access_token: str
    token_type: str