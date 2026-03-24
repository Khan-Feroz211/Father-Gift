from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import setup_logging, setup_sentry

setup_logging()
setup_sentry()

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    from app.services.faiss_service import faiss_service
    import asyncio

    logger.info("app_starting", app_name=settings.APP_NAME, env=settings.APP_ENV)
    try:
        await asyncio.to_thread(faiss_service.load_index)
        logger.info("faiss_index_ready")
    except Exception as exc:
        logger.warning("faiss_index_load_failed", error=str(exc))

    yield

    # Shutdown
    logger.info("app_shutting_down")


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Legal Practice Management System for Pakistani Advocates",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
from app.api.routes import auth, cases, clients, documents, hearings, research, search, users

app.include_router(auth.router, prefix="/api/v1")
app.include_router(cases.router, prefix="/api/v1")
app.include_router(clients.router, prefix="/api/v1")
app.include_router(hearings.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")
app.include_router(search.router, prefix="/api/v1")
app.include_router(research.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok", "version": "1.0.0", "app": settings.APP_NAME}


# Attach lifespan after routes so imports succeed
app.router.lifespan_context = lifespan
