import os
import uuid
from pathlib import Path

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import get_current_user_id
from app.db.session import get_db
from app.models.models import Case, Document
from app.schemas.documents import (
    DocumentGenerateRequest,
    DocumentListResponse,
    DocumentResponse,
)
from app.services.ai_service import ai_service
from app.services.docx_service import generate_docx

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/generate", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def generate_document(
    body: DocumentGenerateRequest,
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

    # Generate content via Claude
    content = await ai_service.generate_document(
        document_type=body.document_type.value,
        case=case,
        title=body.title,
        additional_instructions=body.additional_instructions,
    )

    # Save DOCX
    generated_dir = Path(settings.GENERATED_DOCS_DIR)
    generated_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{body.document_type.value}_{uuid.uuid4().hex[:8]}.docx"
    file_path = str(generated_dir / filename)
    generate_docx(title=body.title, content=content, file_path=file_path)

    # Persist to DB
    doc = Document(
        case_id=uuid.UUID(body.case_id),
        user_id=uuid.UUID(user_id),
        document_type=body.document_type,
        title=body.title,
        content=content,
        file_path=file_path,
    )
    db.add(doc)
    await db.flush()
    await db.refresh(doc)

    logger.info("document_generated", doc_id=str(doc.id), case_id=body.case_id)
    return DocumentResponse.from_orm_model(doc)


@router.get("/", response_model=DocumentListResponse)
async def list_documents(
    case_id: str | None = None,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    query = select(Document).where(Document.user_id == uuid.UUID(user_id))
    if case_id:
        query = query.where(Document.case_id == uuid.UUID(case_id))
    query = query.order_by(Document.generated_at.desc())
    docs = (await db.execute(query)).scalars().all()

    return DocumentListResponse(
        items=[DocumentResponse.from_orm_model(d) for d in docs],
        total=len(docs),
    )


@router.get("/{doc_id}/download")
async def download_document(
    doc_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document).where(
            Document.id == uuid.UUID(doc_id), Document.user_id == uuid.UUID(user_id)
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not doc.file_path or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Document file not found on disk")

    filename = Path(doc.file_path).name
    return FileResponse(
        path=doc.file_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
