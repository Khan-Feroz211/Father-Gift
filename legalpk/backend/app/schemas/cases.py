from datetime import date
from typing import List, Optional
from pydantic import BaseModel

from app.models.models import CaseType, CaseStatus


class PaginationParams(BaseModel):
    page: int = 1
    page_size: int = 20


class CaseCreate(BaseModel):
    title: str
    case_type: CaseType = CaseType.other
    status: CaseStatus = CaseStatus.active
    client_id: Optional[str] = None
    case_number: Optional[str] = None
    court_name: Optional[str] = None
    court_district: Optional[str] = None
    judge_name: Optional[str] = None
    opponent_name: Optional[str] = None
    opponent_advocate: Optional[str] = None
    fir_number: Optional[str] = None
    ps_name: Optional[str] = None
    filing_date: Optional[date] = None
    next_hearing_date: Optional[date] = None
    facts: Optional[str] = None
    legal_issues: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


class CaseUpdate(BaseModel):
    title: Optional[str] = None
    case_type: Optional[CaseType] = None
    status: Optional[CaseStatus] = None
    client_id: Optional[str] = None
    case_number: Optional[str] = None
    court_name: Optional[str] = None
    court_district: Optional[str] = None
    judge_name: Optional[str] = None
    opponent_name: Optional[str] = None
    opponent_advocate: Optional[str] = None
    fir_number: Optional[str] = None
    ps_name: Optional[str] = None
    filing_date: Optional[date] = None
    next_hearing_date: Optional[date] = None
    facts: Optional[str] = None
    legal_issues: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


class CaseResponse(BaseModel):
    id: str
    user_id: str
    client_id: Optional[str] = None
    title: str
    case_type: CaseType
    status: CaseStatus
    case_number: Optional[str] = None
    court_name: Optional[str] = None
    court_district: Optional[str] = None
    judge_name: Optional[str] = None
    opponent_name: Optional[str] = None
    opponent_advocate: Optional[str] = None
    fir_number: Optional[str] = None
    ps_name: Optional[str] = None
    filing_date: Optional[date] = None
    next_hearing_date: Optional[date] = None
    facts: Optional[str] = None
    legal_issues: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_model(cls, obj) -> "CaseResponse":
        return cls(
            id=str(obj.id),
            user_id=str(obj.user_id),
            client_id=str(obj.client_id) if obj.client_id else None,
            title=obj.title,
            case_type=obj.case_type,
            status=obj.status,
            case_number=obj.case_number,
            court_name=obj.court_name,
            court_district=obj.court_district,
            judge_name=obj.judge_name,
            opponent_name=obj.opponent_name,
            opponent_advocate=obj.opponent_advocate,
            fir_number=obj.fir_number,
            ps_name=obj.ps_name,
            filing_date=obj.filing_date,
            next_hearing_date=obj.next_hearing_date,
            facts=obj.facts,
            legal_issues=obj.legal_issues,
            notes=obj.notes,
            tags=obj.tags or [],
            created_at=obj.created_at.isoformat(),
            updated_at=obj.updated_at.isoformat(),
        )


class CaseListResponse(BaseModel):
    items: List[CaseResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
