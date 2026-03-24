import uuid
from datetime import date
from typing import Optional

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user_id
from app.db.session import get_db
from app.models.models import Case, Hearing
from app.schemas.hearings import (
    HearingCreate,
    HearingListResponse,
    HearingResponse,
    HearingUpdate,
)

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/hearings", tags=["hearings"])


@router.get("/", response_model=HearingListResponse)
async def list_hearings(
    case_id: Optional[str] = None,
    upcoming_only: bool = Query(False),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Hearing)
        .join(Case, Hearing.case_id == Case.id)
        .where(Case.user_id == uuid.UUID(user_id))
    )
    count_q = (
        select(func.count())
        .select_from(Hearing)
        .join(Case, Hearing.case_id == Case.id)
        .where(Case.user_id == uuid.UUID(user_id))
    )

    if case_id:
        query = query.where(Hearing.case_id == uuid.UUID(case_id))
        count_q = count_q.where(Hearing.case_id == uuid.UUID(case_id))

    if upcoming_only:
        today = date.today()
        query = query.where(Hearing.hearing_date >= today)
        count_q = count_q.where(Hearing.hearing_date >= today)

    total = (await db.execute(count_q)).scalar_one()
    query = query.order_by(Hearing.hearing_date.asc())
    hearings = (await db.execute(query)).scalars().all()

    return HearingListResponse(
        items=[HearingResponse.from_orm_model(h) for h in hearings],
        total=total,
    )


@router.post("/", response_model=HearingResponse, status_code=status.HTTP_201_CREATED)
async def create_hearing(
    body: HearingCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    # Verify case ownership
    case_result = await db.execute(
        select(Case).where(
            Case.id == uuid.UUID(body.case_id), Case.user_id == uuid.UUID(user_id)
        )
    )
    case = case_result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    hearing = Hearing(
        case_id=uuid.UUID(body.case_id),
        hearing_date=body.hearing_date,
        hearing_time=body.hearing_time,
        courtroom=body.courtroom,
        purpose=body.purpose,
        notes=body.notes,
    )
    db.add(hearing)
    await db.flush()

    # Update case.next_hearing_date if this hearing is earlier
    if case.next_hearing_date is None or body.hearing_date < case.next_hearing_date:
        case.next_hearing_date = body.hearing_date

    await db.refresh(hearing)
    logger.info("hearing_created", hearing_id=str(hearing.id), case_id=body.case_id)
    return HearingResponse.from_orm_model(hearing)


@router.get("/{hearing_id}", response_model=HearingResponse)
async def get_hearing(
    hearing_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Hearing)
        .join(Case, Hearing.case_id == Case.id)
        .where(Hearing.id == uuid.UUID(hearing_id), Case.user_id == uuid.UUID(user_id))
    )
    hearing = result.scalar_one_or_none()
    if not hearing:
        raise HTTPException(status_code=404, detail="Hearing not found")
    return HearingResponse.from_orm_model(hearing)


@router.put("/{hearing_id}", response_model=HearingResponse)
async def update_hearing(
    hearing_id: str,
    body: HearingUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Hearing)
        .join(Case, Hearing.case_id == Case.id)
        .where(Hearing.id == uuid.UUID(hearing_id), Case.user_id == uuid.UUID(user_id))
    )
    hearing = result.scalar_one_or_none()
    if not hearing:
        raise HTTPException(status_code=404, detail="Hearing not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(hearing, field, value)

    await db.flush()
    await db.refresh(hearing)
    return HearingResponse.from_orm_model(hearing)


@router.delete("/{hearing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_hearing(
    hearing_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Hearing)
        .join(Case, Hearing.case_id == Case.id)
        .where(Hearing.id == uuid.UUID(hearing_id), Case.user_id == uuid.UUID(user_id))
    )
    hearing = result.scalar_one_or_none()
    if not hearing:
        raise HTTPException(status_code=404, detail="Hearing not found")
    await db.delete(hearing)
    logger.info("hearing_deleted", hearing_id=hearing_id)
