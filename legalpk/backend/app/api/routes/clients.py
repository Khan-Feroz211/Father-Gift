import math
import uuid
from typing import Optional

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user_id
from app.db.session import get_db
from app.models.models import Client
from app.schemas.clients import (
    ClientCreate,
    ClientListResponse,
    ClientResponse,
    ClientUpdate,
)

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/clients", tags=["clients"])


@router.get("/", response_model=ClientListResponse)
async def list_clients(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    base_where = Client.user_id == uuid.UUID(user_id)
    count_q = select(func.count()).select_from(Client).where(base_where)
    query = select(Client).where(base_where)

    if search:
        like = f"%{search}%"
        search_filter = or_(
            Client.full_name.ilike(like),
            Client.cnic.ilike(like),
            Client.phone.ilike(like),
        )
        query = query.where(search_filter)
        count_q = count_q.where(search_filter)

    total = (await db.execute(count_q)).scalar_one()
    query = query.order_by(Client.full_name.asc()).offset((page - 1) * page_size).limit(page_size)
    clients = (await db.execute(query)).scalars().all()

    return ClientListResponse(
        items=[ClientResponse.from_orm_model(c) for c in clients],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total else 1,
    )


@router.post("/", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    body: ClientCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    client = Client(user_id=uuid.UUID(user_id), **body.model_dump())
    db.add(client)
    await db.flush()
    await db.refresh(client)
    logger.info("client_created", client_id=str(client.id), user_id=user_id)
    return ClientResponse.from_orm_model(client)


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Client).where(
            Client.id == uuid.UUID(client_id), Client.user_id == uuid.UUID(user_id)
        )
    )
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return ClientResponse.from_orm_model(client)


@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: str,
    body: ClientUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Client).where(
            Client.id == uuid.UUID(client_id), Client.user_id == uuid.UUID(user_id)
        )
    )
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(client, field, value)

    await db.flush()
    await db.refresh(client)
    return ClientResponse.from_orm_model(client)


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Client).where(
            Client.id == uuid.UUID(client_id), Client.user_id == uuid.UUID(user_id)
        )
    )
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    await db.delete(client)
    logger.info("client_deleted", client_id=client_id, user_id=user_id)
