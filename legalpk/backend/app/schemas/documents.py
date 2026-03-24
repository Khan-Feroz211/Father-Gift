from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

from app.models.models import DocumentType


class DocumentGenerateRequest(BaseModel):
    case_id: str
    document_type: DocumentType
    title: str
    additional_instructions: Optional[str] = None


class DocumentResponse(BaseModel):
    id: str
    case_id: str
    document_type: DocumentType
    title: str
    content: Optional[str] = None
    file_path: Optional[str] = None
    generated_at: Optional[str] = None
    created_at: str

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_model(cls, obj) -> "DocumentResponse":
        return cls(
            id=str(obj.id),
            case_id=str(obj.case_id),
            document_type=obj.document_type,
            title=obj.title,
            content=obj.content,
            file_path=obj.file_path,
            generated_at=obj.generated_at.isoformat() if obj.generated_at else None,
            created_at=obj.created_at.isoformat(),
        )


class DocumentListResponse(BaseModel):
    items: List[DocumentResponse]
    total: int
