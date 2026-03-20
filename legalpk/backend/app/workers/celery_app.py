from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    "legalpk",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Karachi",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    result_expires=3600,
    beat_schedule={
        # Send hearing reminders every day at 8 PM PKT (14:00 UTC)
        "send_hearing_reminders": {
            "task": "app.workers.tasks.send_hearing_reminders_batch",
            "schedule": crontab(hour=14, minute=0),
            "options": {"queue": "default"},
        },
        # Rebuild FAISS index every day at 2 AM PKT (21:00 UTC previous day)
        "rebuild_faiss_index": {
            "task": "app.workers.tasks.rebuild_faiss_index",
            "schedule": crontab(hour=21, minute=0),
            "options": {"queue": "default"},
        },
    },
    task_routes={
        "app.workers.tasks.send_hearing_reminders_batch": {"queue": "default"},
        "app.workers.tasks.rebuild_faiss_index": {"queue": "default"},
        "app.workers.tasks.generate_document_async": {"queue": "default"},
    },
)

celery_app.autodiscover_tasks(["app.workers"])
