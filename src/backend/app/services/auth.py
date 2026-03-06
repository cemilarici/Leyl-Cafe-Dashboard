from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from app.config import settings


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt(12)).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def _now() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(user_id: str, role: str) -> str:
    expire = _now() + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        "sub": user_id,
        "role": role,
        "exp": expire,
        "type": "access",
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def create_refresh_token(user_id: str) -> tuple[str, str, datetime]:
    """Returns (jti, encoded_token, expires_at)."""
    jti = str(uuid.uuid4())
    expire = _now() + timedelta(days=settings.refresh_token_expire_days)
    payload = {
        "sub": user_id,
        "jti": jti,
        "exp": expire,
        "type": "refresh",
    }
    token = jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)
    return jti, token, expire


def decode_token(token: str) -> dict:
    """Raises JWTError on invalid/expired token."""
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
