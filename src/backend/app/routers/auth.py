from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request, Response, status
from sqlalchemy import select

from app.deps import CurrentUser, DbDep
from app.models.user import RefreshTokenDenylist, User
from app.schemas.auth import LoginRequest, TokenResponse, UserOut
from app.services.auth import (
    create_access_token,
    create_refresh_token,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])

REFRESH_COOKIE = "refresh_token"
COOKIE_OPTS = {
    "httponly": True,
    "samesite": "strict",
    "secure": False,  # set True in production via settings
    "path": "/api/v1/auth",
}


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, response: Response, db: DbDep):
    result = await db.execute(select(User).where(User.email == body.email.lower()))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_CREDENTIALS", "message": "Invalid email or password"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"code": "ACCOUNT_DISABLED"})

    access_token = create_access_token(user.id, user.role)
    jti, refresh_token, expires_at = create_refresh_token(user.id)

    response.set_cookie(REFRESH_COOKIE, refresh_token, expires=expires_at, **COOKIE_OPTS)
    return TokenResponse(access_token=access_token, user=UserOut.model_validate(user))


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    request: Request,
    response: Response,
    db: DbDep,
):
    cookie = request.cookies.get(REFRESH_COOKIE)
    if not cookie:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"code": "NO_REFRESH_TOKEN"})
    try:
        from app.services.auth import decode_token
        from jose import JWTError as _JWTError
        payload = decode_token(cookie)
        if payload.get("type") != "refresh":
            raise _JWTError("wrong type")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"code": "INVALID_REFRESH_TOKEN"})

    result = await db.execute(select(User).where(User.id == payload["sub"]))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail={"code": "USER_NOT_FOUND"})

    access_token = create_access_token(user.id, user.role)
    jti, new_refresh, expires_at = create_refresh_token(user.id)
    response.set_cookie(REFRESH_COOKIE, new_refresh, expires=expires_at, **COOKIE_OPTS)
    return TokenResponse(access_token=access_token, user=UserOut.model_validate(user))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response, current_user: CurrentUser, db: DbDep):
    response.delete_cookie(REFRESH_COOKIE, path="/api/v1/auth")


@router.get("/me", response_model=UserOut)
async def me(current_user: CurrentUser):
    return current_user
