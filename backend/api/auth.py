from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.core.config import settings
from backend.core.security import create_access_token
from backend.database import get_db
from backend.model.user_session import UserSession
from backend.schema.auth_schema import (
    OTPRequest,
    OTPRequestResponse,
    OTPVerifyRequest,
    UserLoginResponse,
    AdminLoginRequest,
    AdminLoginResponse,
)
from backend.service.otp_service import create_otp, verify_otp
from backend.service.auth_service import authenticate_admin

router = APIRouter(
    prefix="/auth",
    tags=["Auth"],
)


@router.post("/request-otp", response_model=OTPRequestResponse)
def request_otp(
    data: OTPRequest,
    db: Session = Depends(get_db),
):
    otp_record = create_otp(
        db=db,
        phone_number=data.phone_number,
    )

    return {
        "message": "OTP generated successfully",
        "phone_number": data.phone_number,
        "dev_otp": otp_record.otp_code,
        "expires_at": otp_record.expires_at,
    }


@router.post("/verify-otp", response_model=UserLoginResponse)
def verify_user_otp(
    data: OTPVerifyRequest,
    db: Session = Depends(get_db),
):
    user = verify_otp(
        db=db,
        phone_number=data.phone_number,
        otp_code=data.otp_code,
    )

    access_token = create_access_token(
        subject=str(user.id),
        role="user",
    )

    session = UserSession(
        user_id=user.id,
        device_id=data.device_id,
        jwt_token=access_token,
        expires_at=datetime.utcnow()
        + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    db.add(session)
    db.commit()

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/admin/login", response_model=AdminLoginResponse)
def admin_login(
    data: AdminLoginRequest,
    db: Session = Depends(get_db),
):
    admin = authenticate_admin(
        db=db,
        email=data.email,
        password=data.password,
    )

    access_token = create_access_token(
        subject=str(admin.id),
        role=admin.role,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "admin": admin,
    }