from __future__ import annotations

from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User, RefreshTokenDenylist
from app.services.auth import decode_token

bearer_scheme = HTTPBearer(auto_error=False)

DbDep = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    db: DbDep,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)] = None,
) -> User:
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={"code": "TOKEN_EXPIRED", "message": "Could not validate credentials"},
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not credentials:
        raise credentials_exc
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("type") != "access":
            raise credentials_exc
        user_id: str = payload.get("sub", "")
    except JWTError:
        raise credentials_exc

    result = await db.execute(select(User).where(User.id == user_id, User.is_active.is_(True)))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exc
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_role(*roles: str):
    """Dependency factory — raises 403 if current user's role is not in `roles`."""
    async def _check(current_user: CurrentUser) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "INSUFFICIENT_ROLE", "required": list(roles), "actual": current_user.role},
            )
        return current_user
    return _check


async def get_current_user_from_refresh(
    db: DbDep,
    refresh_token: Annotated[str | None, Cookie(alias="refresh_token")] = None,
) -> tuple[User, str]:
    """Returns (user, jti) from refresh token cookie."""
    exc = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"code": "INVALID_REFRESH_TOKEN"})
    if not refresh_token:
        raise exc
    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise exc
        user_id: str = payload["sub"]
        jti: str = payload["jti"]
    except (JWTError, KeyError):
        raise exc

    # Check denylist
    result = await db.execute(select(RefreshTokenDenylist).where(RefreshTokenDenylist.jti == jti))
    if result.scalar_one_or_none():
        raise exc

    result = await db.execute(select(User).where(User.id == user_id, User.is_active.is_(True)))
    user = result.scalar_one_or_none()
    if not user:
        raise exc

    return user, jti
