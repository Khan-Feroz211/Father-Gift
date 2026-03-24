import json
import math
import uuid
from typing import Optional

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user_id
from app.db.session import get_db
from app.models.models import Case, CaseStatus, CaseType
from app.schemas.cases import (
    CaseCreate,
    CaseListResponse,
    CaseResponse,
    CaseUpdate,
)
from app.services.cache_service import cache_service
from app.services.faiss_service import faiss_service

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/cases", tags=["cases"])

CACHE_TTL = 60


@router.get("/", response_model=CaseListResponse)
async def list_cases(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[CaseStatus] = None,
    case_type: Optional[CaseType] = None,
    search: Optional[str] = None,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    cache_key = f"cases:{user_id}:{page}:{page_size}:{status}:{case_type}:{search}"
    cached = await cache_service.cache_get(cache_key)
    if cached:
        return CaseListResponse(**json.loads(cached))

    query = select(Case).where(Case.user_id == uuid.UUID(user_id))
    count_query = select(func.count()).select_from(Case).where(Case.user_id == uuid.UUID(user_id))

    if status:
        query = query.where(Case.status == status)
        count_query = count_query.where(Case.status == status)
    if case_type:
        query = query.where(Case.case_type == case_type)
        count_query = count_query.where(Case.case_type == case_type)
    if search:
        like = f"%{search}%"
        query = query.where(Case.title.ilike(like) | Case.case_number.ilike(like))
        count_query = count_query.where(
            Case.title.ilike(like) | Case.case_number.ilike(like)
        )

    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    query = query.order_by(Case.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    cases = result.scalars().all()

    response = CaseListResponse(
        items=[CaseResponse.from_orm_model(c) for c in cases],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total else 1,
    )
    await cache_service.cache_set(cache_key, response.model_dump_json(), ttl=CACHE_TTL)
    return response


@router.post("/", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
async def create_case(
    body: CaseCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    case = Case(
        user_id=uuid.UUID(user_id),
        client_id=uuid.UUID(body.client_id) if body.client_id else None,
        title=body.title,
        case_type=body.case_type,
        status=body.status,
        case_number=body.case_number,
        court_name=body.court_name,
        court_district=body.court_district,
        judge_name=body.judge_name,
        opponent_name=body.opponent_name,
        opponent_advocate=body.opponent_advocate,
        fir_number=body.fir_number,
        ps_name=body.ps_name,
        filing_date=body.filing_date,
        next_hearing_date=body.next_hearing_date,
        facts=body.facts,
        legal_issues=body.legal_issues,
        notes=body.notes,
        tags=body.tags or [],
    )
    db.add(case)
    await db.flush()
    await db.refresh(case)

    try:
        await faiss_service.add_case(case)
    except Exception as exc:
        logger.warning("faiss_add_failed", case_id=str(case.id), error=str(exc))

    logger.info("case_created", case_id=str(case.id), user_id=user_id)
    return CaseResponse.from_orm_model(case)


@router.get("/{case_id}", response_model=CaseResponse)
async def get_case(
    case_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    cache_key = f"case:{case_id}"
    cached = await cache_service.cache_get(cache_key)
    if cached:
        return CaseResponse(**json.loads(cached))

    result = await db.execute(
        select(Case).where(Case.id == uuid.UUID(case_id), Case.user_id == uuid.UUID(user_id))
    )
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    resp = CaseResponse.from_orm_model(case)
    await cache_service.cache_set(cache_key, resp.model_dump_json(), ttl=CACHE_TTL)
    return resp


@router.put("/{case_id}", response_model=CaseResponse)
async def update_case(
    case_id: str,
    body: CaseUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Case).where(Case.id == uuid.UUID(case_id), Case.user_id == uuid.UUID(user_id))
    )
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    update_data = body.model_dump(exclude_unset=True)
    if "client_id" in update_data and update_data["client_id"]:
        update_data["client_id"] = uuid.UUID(update_data["client_id"])

    for field, value in update_data.items():
        setattr(case, field, value)

    await db.flush()
    await db.refresh(case)

    await cache_service.cache_delete(f"case:{case_id}")

    try:
        await faiss_service.add_case(case)
    except Exception as exc:
        logger.warning("faiss_update_failed", case_id=case_id, error=str(exc))

    return CaseResponse.from_orm_model(case)


@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_case(
    case_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Case).where(Case.id == uuid.UUID(case_id), Case.user_id == uuid.UUID(user_id))
    )
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    await db.delete(case)
    await cache_service.cache_delete(f"case:{case_id}")

    try:
        await faiss_service.remove_case(case_id)
    except Exception as exc:
        logger.warning("faiss_remove_failed", case_id=case_id, error=str(exc))

    logger.info("case_deleted", case_id=case_id, user_id=user_id)
