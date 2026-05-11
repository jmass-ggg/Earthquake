import random
from datetime import datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.core.config import settings
from backend.model.otp_verification import OTPVerification
from backend.model.user import User


def generate_otp() -> str:
    return str(random.randint(100000, 999999))


def get_or_create_user(db: Session, phone_number: str) -> User:
    user = db.query(User).filter(User.phone_number == phone_number).first()

    if user:
        return user

    user = User(
        phone_number=phone_number,
        is_verified=False,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def create_otp(db: Session, phone_number: str) -> OTPVerification:
    get_or_create_user(db, phone_number)

    old_otps = (
        db.query(OTPVerification)
        .filter(
            OTPVerification.phone_number == phone_number,
            OTPVerification.is_used == False,
        )
        .all()
    )

    for otp in old_otps:
        otp.is_used = True

    otp_code = generate_otp()

    expires_at = datetime.utcnow() + timedelta(
        minutes=settings.OTP_EXPIRE_MINUTES
    )

    otp_record = OTPVerification(
        phone_number=phone_number,
        otp_code=otp_code,
        expires_at=expires_at,
        is_used=False,
    )

    db.add(otp_record)
    db.commit()
    db.refresh(otp_record)

    return otp_record


def verify_otp(db: Session, phone_number: str, otp_code: str) -> User:
    otp_record = (
        db.query(OTPVerification)
        .filter(
            OTPVerification.phone_number == phone_number,
            OTPVerification.otp_code == otp_code,
            OTPVerification.is_used == False,
        )
        .order_by(OTPVerification.created_at.desc())
        .first()
    )

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP",
        )

    if otp_record.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired",
        )

    user = get_or_create_user(db, phone_number)

    otp_record.is_used = True
    user.is_verified = True
    user.last_active = datetime.utcnow()

    db.commit()
    db.refresh(user)

    return user