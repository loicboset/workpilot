"""REST routes for review templates."""

import uuid

from fastapi import APIRouter, status

from app.common import create_row, get_active_or_404, select_rows, soft_delete, update_row
from app.db.enums import ReviewKind
from app.db.models import ReviewTemplate
from app.db.session import SessionDep
from app.domain.review_templates.schemas import (
    ReviewTemplateCreate,
    ReviewTemplateRead,
    ReviewTemplateUpdate,
)

router = APIRouter(prefix="/api/review-templates", tags=["review templates"])


@router.get("", response_model=list[ReviewTemplateRead])
def list_review_templates(
    session: SessionDep,
    kind: ReviewKind | None = None,
    include_deleted: bool = False,
) -> list[ReviewTemplate]:
    stmt = select_rows(ReviewTemplate, include_deleted)
    if kind is not None:
        stmt = stmt.where(ReviewTemplate.kind == kind)
    stmt = stmt.order_by(ReviewTemplate.name)
    return list(session.scalars(stmt))


@router.post("", response_model=ReviewTemplateRead, status_code=status.HTTP_201_CREATED)
def create_review_template(data: ReviewTemplateCreate, session: SessionDep) -> ReviewTemplate:
    return create_row(session, ReviewTemplate, data)


@router.get("/{template_id}", response_model=ReviewTemplateRead)
def get_review_template(template_id: uuid.UUID, session: SessionDep) -> ReviewTemplate:
    return get_active_or_404(session, ReviewTemplate, template_id)


@router.patch("/{template_id}", response_model=ReviewTemplateRead)
def update_review_template(
    template_id: uuid.UUID, data: ReviewTemplateUpdate, session: SessionDep
) -> ReviewTemplate:
    template = get_active_or_404(session, ReviewTemplate, template_id)
    return update_row(session, template, data.changes())


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review_template(template_id: uuid.UUID, session: SessionDep) -> None:
    soft_delete(session, get_active_or_404(session, ReviewTemplate, template_id))
