import uuid

import structlog
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user_id
from app.db.session import get_db
from app.models.models import Case, Hearing
from app.schemas.research import (
    ResearchRequest,
    ResearchResponse,
    SummarizeRequest,
    SummarizeResponse,
)
from app.services.ai_service import ai_service

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/research", tags=["research"])


@router.post("/research", response_model=ResearchResponse)
async def legal_research(
    body: ResearchRequest,
    user_id: str = Depends(get_current_user_id),
):
    answer = await ai_service.legal_research(query=body.query, context=body.context)
    logger.info("legal_research_done", query=body.query[:50], user_id=user_id)
    return ResearchResponse(query=body.query, answer=answer)


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_case(
    body: SummarizeRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    case_result = await db.execute(
        select(Case).where(
            Case.id == uuid.UUID(body.case_id), Case.user_id == uuid.UUID(user_id)
        )
    )
    case = case_result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    hearings = []
    if body.include_hearings:
        h_result = await db.execute(
            select(Hearing).where(Hearing.case_id == uuid.UUID(body.case_id)).order_by(
                Hearing.hearing_date.asc()
            )
        )
        hearings = h_result.scalars().all()

    summary, key_points = await ai_service.summarize_case(case=case, hearings=hearings)
    return SummarizeResponse(case_id=body.case_id, summary=summary, key_points=key_points)
