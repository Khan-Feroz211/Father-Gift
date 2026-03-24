import uuid
from typing import Optional

import structlog
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user_id, hash_password, verify_password
from app.db.session import get_db
from app.models.models import User
from app.schemas.auth import UserResponse

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/users", tags=["users"])


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    bar_number: Optional[str] = None
    court_name: Optional[str] = None
    phone: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None


@router.put("/me", response_model=UserResponse)
async def update_profile(
    body: ProfileUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.full_name is not None:
        user.full_name = body.full_name
    if body.bar_number is not None:
        user.bar_number = body.bar_number
    if body.court_name is not None:
        user.court_name = body.court_name
    if body.phone is not None:
        user.phone = body.phone

    if body.new_password:
        if not body.current_password:
            raise HTTPException(status_code=400, detail="Current password required to change password")
        if not verify_password(body.current_password, user.hashed_password):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        user.hashed_password = hash_password(body.new_password)

    await db.flush()
    await db.refresh(user)
    logger.info("profile_updated", user_id=user_id)

    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        bar_number=user.bar_number,
        court_name=user.court_name,
        phone=user.phone,
        is_active=user.is_active,
    )
