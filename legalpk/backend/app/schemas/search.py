from typing import List, Optional
from pydantic import BaseModel


class SearchRequest(BaseModel):
    query: str
    top_k: Optional[int] = None


class SearchResult(BaseModel):
    case_id: str
    title: str
    case_type: str
    status: str
    score: float
    similarity_percent: int
    snippet: Optional[str] = None


class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]
    total: int
