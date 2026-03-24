from typing import Optional
from pydantic import BaseModel


class ResearchRequest(BaseModel):
    query: str
    context: Optional[str] = None


class ResearchResponse(BaseModel):
    query: str
    answer: str
    citations: Optional[list] = None


class SummarizeRequest(BaseModel):
    case_id: str
    include_hearings: bool = True
    include_documents: bool = False


class SummarizeResponse(BaseModel):
    case_id: str
    summary: str
    key_points: Optional[list] = None
