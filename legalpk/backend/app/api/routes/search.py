import structlog
from fastapi import APIRouter, Depends

from app.core.security import get_current_user_id
from app.schemas.search import SearchRequest, SearchResponse
from app.services.faiss_service import faiss_service

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/search", tags=["search"])


@router.post("/semantic", response_model=SearchResponse)
async def semantic_search(
    body: SearchRequest,
    user_id: str = Depends(get_current_user_id),
):
    results = await faiss_service.search(query=body.query, top_k=body.top_k)
    logger.info("semantic_search", query=body.query[:50], results=len(results), user_id=user_id)
    return SearchResponse(
        query=body.query,
        results=results,
        total=len(results),
    )
