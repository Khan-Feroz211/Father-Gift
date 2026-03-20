from datetime import date, time
from typing import List, Optional
from pydantic import BaseModel

from app.models.models import HearingPurpose


class HearingCreate(BaseModel):
    case_id: str
    hearing_date: date
    hearing_time: Optional[time] = None
    courtroom: Optional[str] = None
    purpose: HearingPurpose = HearingPurpose.other
    notes: Optional[str] = None


class HearingUpdate(BaseModel):
    hearing_date: Optional[date] = None
    hearing_time: Optional[time] = None
    courtroom: Optional[str] = None
    purpose: Optional[HearingPurpose] = None
    outcome: Optional[str] = None
    next_date_set: Optional[date] = None
    notes: Optional[str] = None


class HearingResponse(BaseModel):
    id: str
    case_id: str
    hearing_date: date
    hearing_time: Optional[str] = None
    courtroom: Optional[str] = None
    purpose: HearingPurpose
    outcome: Optional[str] = None
    next_date_set: Optional[date] = None
    notes: Optional[str] = None
    reminder_sent: bool
    created_at: str

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_model(cls, obj) -> "HearingResponse":
        return cls(
            id=str(obj.id),
            case_id=str(obj.case_id),
            hearing_date=obj.hearing_date,
            hearing_time=str(obj.hearing_time) if obj.hearing_time else None,
            courtroom=obj.courtroom,
            purpose=obj.purpose,
            outcome=obj.outcome,
            next_date_set=obj.next_date_set,
            notes=obj.notes,
            reminder_sent=obj.reminder_sent,
            created_at=obj.created_at.isoformat(),
        )


class HearingListResponse(BaseModel):
    items: List[HearingResponse]
    total: int
