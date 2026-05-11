from datetime import datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from backend.core.config import settings
from backend.core.security import create_access_token, create_refresh_token
from backend.database import get_db
from backend.model.admin import Admin
from backend.model.user import User
from backend.model.user_session import UserSession
from backend.schema.auth_schema import (
    OTPRequest,
    OTPRequestResponse,
    OTPVerifyRequest,
    UserLoginResponse,
    AdminLoginRequest,
    AdminLoginResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
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

    refresh_token = create_refresh_token(
        subject=str(user.id),
        role="user",
    )

    session = UserSession(
        user_id=user.id,
        device_id=data.device_id,
        jwt_token=access_token,
        refresh_token=refresh_token,
        expires_at=datetime.utcnow()
        + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        refresh_expires_at=datetime.utcnow()
        + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )

    db.add(session)
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/user/refresh", response_model=RefreshTokenResponse)
def refresh_user_access_token(
    data: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    try:
        payload = jwt.decode(
            data.refresh_token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )

        user_id = payload.get("sub")
        role = str(payload.get("role", "")).lower().strip()
        token_type = payload.get("type")

        if token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Only refresh token is allowed",
            )

        if role != "user":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User refresh token required",
            )

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        user_uuid = UUID(str(user_id))

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user id in refresh token",
        )

    user = db.query(User).filter(User.id == user_uuid).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User does not exist",
        )

    access_token = create_access_token(
        subject=str(user.id),
        role="user",
        phone_number=user.phone_number,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
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

    admin_role = str(admin.role).lower().strip()

    access_token = create_access_token(
        subject=str(admin.id),
        role=admin_role,
        email=admin.email,
    )

    refresh_token = create_refresh_token(
        subject=str(admin.id),
        role=admin_role,
        email=admin.email,
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "admin": admin,
    }


@router.post("/admin/refresh", response_model=RefreshTokenResponse)
def refresh_admin_access_token(
    data: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    try:
        payload = jwt.decode(
            data.refresh_token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )

        admin_id = payload.get("sub")
        role = str(payload.get("role", "")).lower().strip()
        token_type = payload.get("type")

        if token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Only refresh token is allowed",
            )

        if role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin refresh token required",
            )

        if not admin_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        admin_uuid = UUID(str(admin_id))

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin id in refresh token",
        )

    admin = db.query(Admin).filter(Admin.id == admin_uuid).first()

    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin does not exist",
        )

    if str(admin.role).lower().strip() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    access_token = create_access_token(
        subject=str(admin.id),
        role="admin",
        email=admin.email,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }