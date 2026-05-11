from datetime import datetime, timedelta
from typing import Optional

from jose import jwt
from passlib.context import CryptContext

from backend.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    subject: str,
    role: str,
    expires_delta: Optional[timedelta] = None,
    email: Optional[str] = None,
    phone_number: Optional[str] = None,
) -> str:
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    expire = datetime.utcnow() + expires_delta

    payload = {
        "sub": str(subject),
        "role": role.lower().strip(),
        "type": "access",
        "exp": expire,
    }

    if email:
        payload["email"] = email

    if phone_number:
        payload["phone_number"] = phone_number

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def create_refresh_token(
    subject: str,
    role: str,
    expires_delta: Optional[timedelta] = None,
    email: Optional[str] = None,
    phone_number: Optional[str] = None,
) -> str:
    if expires_delta is None:
        expires_delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    expire = datetime.utcnow() + expires_delta

    payload = {
        "sub": str(subject),
        "role": role.lower().strip(),
        "type": "refresh",
        "exp": expire,
    }

    if email:
        payload["email"] = email

    if phone_number:
        payload["phone_number"] = phone_number

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )