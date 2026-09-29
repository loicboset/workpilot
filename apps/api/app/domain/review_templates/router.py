"""REST routes for review templates."""

import uuid

from fastapi import APIRouter, status

from app.common import create_row, get_in_space_or_404, select_in_space, soft_delete, update_row
from app.db.enums import ReviewKind
from app.db.models import ReviewTemplate
from app.db.session import SessionDep
from app.domain.review_templates.schemas import (
    ReviewTemplateCreate,
    ReviewTemplateRead,
    ReviewTemplateUpdate,
)
from app.domain.spaces.current import CurrentSpace

router = APIRouter(prefix="/review-templates", tags=["review templates"])


@router.get("", response_model=list[ReviewTemplateRead])
def list_review_templates(
    session: SessionDep,
    space: CurrentSpace,
    kind: ReviewKind | None = None,
    include_deleted: bool = False,
) -> list[ReviewTemplate]:
    stmt = select_in_space(ReviewTemplate, space.id, include_deleted)
    if kind is not None:
        stmt = stmt.where(ReviewTemplate.kind == kind)
    stmt = stmt.order_by(ReviewTemplate.name)
    return list(session.scalars(stmt))


@router.post("", response_model=ReviewTemplateRead, status_code=status.HTTP_201_CREATED)
def create_review_template(
    data: ReviewTemplateCreate, session: SessionDep, space: CurrentSpace
) -> ReviewTemplate:
    return create_row(session, ReviewTemplate, data, space_id=space.id)


@router.get("/{template_id}", response_model=ReviewTemplateRead)
def get_review_template(
    template_id: uuid.UUID, session: SessionDep, space: CurrentSpace
) -> ReviewTemplate:
    return get_in_space_or_404(session, ReviewTemplate, space.id, template_id)


@router.patch("/{template_id}", response_model=ReviewTemplateRead)
def update_review_template(
    template_id: uuid.UUID, data: ReviewTemplateUpdate, session: SessionDep, space: CurrentSpace
) -> ReviewTemplate:
    template = get_in_space_or_404(session, ReviewTemplate, space.id, template_id)
    return update_row(session, template, data.changes())


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review_template(
    template_id: uuid.UUID, session: SessionDep, space: CurrentSpace
) -> None:
    soft_delete(session, get_in_space_or_404(session, ReviewTemplate, space.id, template_id))
