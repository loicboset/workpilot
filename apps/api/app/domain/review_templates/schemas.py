"""Request and response shapes for review templates."""

import uuid
from typing import Annotated

from pydantic import BaseModel, Field

from app.common import InSpaceRead, InSpaceSyncRow, PartialUpdate, RequestBody, Title
from app.db.enums import ReviewKind

Questions = Annotated[list[Title], Field(min_length=1, max_length=30)]


class ReviewTemplateFields(BaseModel):
    """The fields a client writes."""

    name: Title
    kind: ReviewKind
    questions: Questions


class ReviewTemplateCreate(ReviewTemplateFields, RequestBody):
    id: uuid.UUID | None = None


class ReviewTemplateUpdate(PartialUpdate):
    required = frozenset({"name", "kind", "questions"})

    name: Title | None = None
    kind: ReviewKind | None = None
    questions: Questions | None = None


class ReviewTemplateRead(InSpaceRead):
    name: str
    kind: ReviewKind
    questions: list[str]


class ReviewTemplateSyncRow(ReviewTemplateFields, InSpaceSyncRow):
    """A review template as sent by a device through sync."""
