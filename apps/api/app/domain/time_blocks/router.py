"""REST routes for time blocks: reserved slots of time (ADR 0017)."""

import uuid

from fastapi import APIRouter, status

from app.common import (
    AwareTimestamp,
    create_row,
    get_active_or_404,
    select_rows,
    soft_delete,
    update_row,
)
from app.db.models import TimeBlock
from app.db.session import SessionDep
from app.domain.time_blocks.schemas import TimeBlockCreate, TimeBlockRead, TimeBlockUpdate

router = APIRouter(prefix="/api/time-blocks", tags=["time blocks"])


@router.get("", response_model=list[TimeBlockRead])
def list_time_blocks(
    session: SessionDep,
    start_from: AwareTimestamp | None = None,
    start_to: AwareTimestamp | None = None,
    completed: bool | None = None,
    milestone_id: uuid.UUID | None = None,
    include_deleted: bool = False,
) -> list[TimeBlock]:
    stmt = select_rows(TimeBlock, include_deleted)
    if start_from is not None:
        stmt = stmt.where(TimeBlock.start_at >= start_from)
    if start_to is not None:
        stmt = stmt.where(TimeBlock.start_at <= start_to)
    if completed is True:
        stmt = stmt.where(TimeBlock.completed_at.is_not(None))
    elif completed is False:
        stmt = stmt.where(TimeBlock.completed_at.is_(None))
    if milestone_id is not None:
        stmt = stmt.where(TimeBlock.milestone_id == milestone_id)
    stmt = stmt.order_by(TimeBlock.start_at)
    return list(session.scalars(stmt))


@router.post("", response_model=TimeBlockRead, status_code=status.HTTP_201_CREATED)
def create_time_block(data: TimeBlockCreate, session: SessionDep) -> TimeBlock:
    return create_row(session, TimeBlock, data)


@router.get("/{time_block_id}", response_model=TimeBlockRead)
def get_time_block(time_block_id: uuid.UUID, session: SessionDep) -> TimeBlock:
    return get_active_or_404(session, TimeBlock, time_block_id)


@router.patch("/{time_block_id}", response_model=TimeBlockRead)
def update_time_block(
    time_block_id: uuid.UUID, data: TimeBlockUpdate, session: SessionDep
) -> TimeBlock:
    time_block = get_active_or_404(session, TimeBlock, time_block_id)
    return update_row(session, time_block, data.changes())


@router.delete("/{time_block_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_time_block(time_block_id: uuid.UUID, session: SessionDep) -> None:
    soft_delete(session, get_active_or_404(session, TimeBlock, time_block_id))
