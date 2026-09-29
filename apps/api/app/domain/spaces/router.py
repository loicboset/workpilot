"""REST routes for spaces. They are archived, never deleted (ADR 0031)."""

import uuid

from fastapi import APIRouter, HTTPException, status

from app.ai.service import copy_ai_settings
from app.common import create_row, get_active_or_404, select_rows, update_row
from app.db.models import Space
from app.db.session import SessionDep
from app.domain.spaces.schemas import SpaceCreate, SpaceRead, SpaceUpdate
from app.domain.spaces.slug import slugify

router = APIRouter(prefix="/api/spaces", tags=["spaces"])


@router.get("", response_model=list[SpaceRead])
def list_spaces(session: SessionDep, archived: bool | None = None) -> list[Space]:
    """Every space, oldest first."""
    stmt = select_rows(Space)
    if archived is True:
        stmt = stmt.where(Space.archived_at.is_not(None))
    elif archived is False:
        stmt = stmt.where(Space.archived_at.is_(None))
    return list(session.scalars(stmt.order_by(Space.created_at)))


@router.post("", response_model=SpaceRead, status_code=status.HTTP_201_CREATED)
def create_space(data: SpaceCreate, session: SessionDep) -> Space:
    slug = data.slug or _slug_from(data.name)
    space = create_row(session, Space, data.model_copy(update={"slug": slug}))
    if data.copy_ai_from is not None:
        copy_ai_settings(session, from_space_id=data.copy_ai_from, to_space_id=space.id)
        session.commit()
    return space


@router.get("/{space_id}", response_model=SpaceRead)
def get_space(space_id: uuid.UUID, session: SessionDep) -> Space:
    return get_active_or_404(session, Space, space_id)


@router.patch("/{space_id}", response_model=SpaceRead)
def update_space(space_id: uuid.UUID, data: SpaceUpdate, session: SessionDep) -> Space:
    space = get_active_or_404(session, Space, space_id)
    changes = data.changes()
    if "name" in changes and "slug" not in changes:
        changes["slug"] = _slug_from(data.name or "")
    return update_row(session, space, changes)


def _slug_from(name: str) -> str:
    slug = slugify(name)
    if not slug:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, "the name needs a letter or a digit"
        )
    return slug
