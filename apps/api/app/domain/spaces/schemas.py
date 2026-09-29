"""Request and response shapes for spaces."""

import uuid
from datetime import datetime
from typing import Annotated

from pydantic import AfterValidator, BaseModel, Field, StringConstraints

from app.common import AwareTimestamp, PartialUpdate, RequestBody, SyncedRead, SyncRow
from app.db.enums import Palette
from app.db.models.space import RESERVED_SLUGS, SLUG_MAX_LENGTH, SLUG_PATTERN

SpaceName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=40)]


def check_not_reserved(slug: str) -> str:
    if slug in RESERVED_SLUGS:
        raise ValueError("this name is used by the app")
    return slug


Slug = Annotated[
    str,
    StringConstraints(pattern=SLUG_PATTERN, max_length=SLUG_MAX_LENGTH),
    AfterValidator(check_not_reserved),
]


class SpaceFields(BaseModel):
    """The fields a client writes."""

    name: SpaceName
    palette: Palette = Palette.GROVE
    archived_at: AwareTimestamp | None = None


class SpaceCreate(SpaceFields, RequestBody):
    id: uuid.UUID | None = None
    # The name in URLs; made from the name when not given.
    slug: Slug | None = None
    # A space whose AI settings and prompts the new one starts with; not a column.
    copy_ai_from: uuid.UUID | None = Field(default=None, exclude=True)


class SpaceUpdate(PartialUpdate):
    """A new name without a slug gives a new slug, made from the name."""

    required = frozenset({"name", "slug", "palette"})

    name: SpaceName | None = None
    slug: Slug | None = None
    palette: Palette | None = None
    archived_at: AwareTimestamp | None = None


class SpaceRead(SyncedRead):
    name: str
    slug: str
    palette: Palette
    archived_at: datetime | None


class SpaceSyncRow(SpaceFields, SyncRow):
    """A space as sent by a device through sync."""

    slug: Slug
    # Read when the space first reaches the server; not a column.
    copy_ai_from: uuid.UUID | None = Field(default=None, exclude=True)
