import uuid
import structlog
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user_id,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models.models import User
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services.cache_service import cache_service

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])

RATE_LIMIT_KEY = "login_rate"
RATE_LIMIT_MAX = 10
RATE_LIMIT_WINDOW = 60


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
        bar_number=body.bar_number,
        court_name=body.court_name,
        phone=body.phone,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    logger.info("user_registered", email=body.email, user_id=str(user.id))
    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        bar_number=user.bar_number,
        court_name=user.court_name,
        phone=user.phone,
        is_active=user.is_active,
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    rate_key = f"{RATE_LIMIT_KEY}:{client_ip}"

    allowed = await cache_service.rate_limit_check(rate_key, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW)
    if not allowed:
        raise HTTPException(status_code=429, detail="Too many login attempts. Try again later.")

    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive")

    user_id = str(user.id)
    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)

    await cache_service.store_refresh_token(user_id, refresh_token)
    logger.info("user_logged_in", user_id=user_id, ip=client_ip)

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: RefreshRequest):
    payload = decode_token(body.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id: str = payload.get("sub", "")
    valid = await cache_service.validate_refresh_token(user_id, body.refresh_token)
    if not valid:
        raise HTTPException(status_code=401, detail="Refresh token revoked or invalid")

    new_access = create_access_token(user_id)
    new_refresh = create_refresh_token(user_id)
    await cache_service.store_refresh_token(user_id, new_refresh)

    return TokenResponse(access_token=new_access, refresh_token=new_refresh)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(user_id: str = Depends(get_current_user_id)):
    await cache_service.revoke_refresh_token(user_id)
    logger.info("user_logged_out", user_id=user_id)


@router.get("/me", response_model=UserResponse)
async def get_me(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        bar_number=user.bar_number,
        court_name=user.court_name,
        phone=user.phone,
        is_active=user.is_active,
    )
