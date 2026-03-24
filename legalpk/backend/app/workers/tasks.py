import asyncio
from datetime import date, timedelta

import structlog

from app.workers.celery_app import celery_app

logger = structlog.get_logger(__name__)


def run_async(coro):
    """Run an async coroutine from a synchronous Celery task."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(name="app.workers.tasks.send_hearing_reminders_batch", bind=True, max_retries=3)
def send_hearing_reminders_batch(self):
    """Send email reminders for hearings scheduled for tomorrow."""
    return run_async(_send_hearing_reminders_async())


async def _send_hearing_reminders_async():
    from sqlalchemy import select
    from sqlalchemy.ext.asyncio import AsyncSession

    from app.db.session import AsyncSessionLocal
    from app.models.models import Case, Hearing, User
    from app.services.email_service import send_hearing_reminder

    tomorrow = date.today() + timedelta(days=1)
    sent_count = 0
    failed_count = 0

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Hearing, Case, User)
            .join(Case, Hearing.case_id == Case.id)
            .join(User, Case.user_id == User.id)
            .where(Hearing.hearing_date == tomorrow, Hearing.reminder_sent == False)  # noqa: E712
        )
        rows = result.all()

        for hearing, case, user in rows:
            if not user.email:
                continue
            success = await send_hearing_reminder(
                to_email=user.email,
                advocate_name=user.full_name,
                case_title=case.title,
                case_number=case.case_number,
                hearing_date=str(hearing.hearing_date),
                hearing_time=str(hearing.hearing_time) if hearing.hearing_time else None,
                courtroom=hearing.courtroom,
                court_name=case.court_name,
                purpose=hearing.purpose.value,
            )
            if success:
                hearing.reminder_sent = True
                sent_count += 1
            else:
                failed_count += 1

        await db.commit()

    logger.info("hearing_reminders_done", sent=sent_count, failed=failed_count, date=str(tomorrow))
    return {"sent": sent_count, "failed": failed_count}


@celery_app.task(name="app.workers.tasks.rebuild_faiss_index", bind=True, max_retries=2)
def rebuild_faiss_index(self):
    """Rebuild the FAISS index from all cases in the database."""
    return run_async(_rebuild_faiss_async())


async def _rebuild_faiss_async():
    from sqlalchemy import select

    from app.db.session import AsyncSessionLocal
    from app.models.models import Case
    from app.services.faiss_service import faiss_service

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Case))
        cases = result.scalars().all()

    await faiss_service.rebuild_full(cases)
    logger.info("faiss_rebuild_completed", case_count=len(cases))
    return {"cases_indexed": len(cases)}


@celery_app.task(name="app.workers.tasks.generate_document_async", bind=True, max_retries=2)
def generate_document_async(self, case_id: str, document_type: str, title: str, user_id: str):
    """Async Celery task for document generation (fire-and-forget pattern)."""
    return run_async(_generate_document_async(case_id, document_type, title, user_id))


async def _generate_document_async(
    case_id: str, document_type: str, title: str, user_id: str
):
    from sqlalchemy import select

    from app.db.session import AsyncSessionLocal
    from app.models.models import Case, Document
    from app.models.models import DocumentType
    from app.services.ai_service import ai_service
    from app.services.docx_service import generate_docx
    from app.core.config import settings
    from pathlib import Path
    import uuid as uuid_lib

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Case).where(Case.id == uuid_lib.UUID(case_id)))
        case = result.scalar_one_or_none()
        if not case:
            logger.error("generate_document_async_case_not_found", case_id=case_id)
            return

        content = await ai_service.generate_document(
            document_type=document_type, case=case, title=title
        )

        generated_dir = Path(settings.GENERATED_DOCS_DIR)
        generated_dir.mkdir(parents=True, exist_ok=True)
        filename = f"{document_type}_{uuid_lib.uuid4().hex[:8]}.docx"
        file_path = str(generated_dir / filename)
        generate_docx(title=title, content=content, file_path=file_path)

        doc = Document(
            case_id=uuid_lib.UUID(case_id),
            user_id=uuid_lib.UUID(user_id),
            document_type=DocumentType(document_type),
            title=title,
            content=content,
            file_path=file_path,
        )
        db.add(doc)
        await db.commit()
        logger.info("document_generated_async", doc_id=str(doc.id))
        return str(doc.id)
