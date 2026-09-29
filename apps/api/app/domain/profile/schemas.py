"""Request and response shapes for the profile."""

import uuid
from typing import Annotated
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import AfterValidator, BaseModel, StringConstraints

from app.common import RequestBody, SyncedRead, SyncRow
from app.db.enums import Locale, Palette, Theme

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]


def check_timezone(value: str) -> str:
    """Accept only IANA timezone names, e.g. "Europe/Zurich"."""
    try:
        ZoneInfo(value)
    except (ZoneInfoNotFoundError, ValueError) as error:
        raise ValueError("unknown timezone") from error
    return value


Timezone = Annotated[str, AfterValidator(check_timezone)]


class ProfileFields(BaseModel):
    """The fields a client writes."""

    first_name: Name
    last_name: Name | None = None
    locale: Locale = Locale.EN
    timezone: Timezone = "UTC"
    city: Name | None = None
    theme: Theme = Theme.SYSTEM
    palette: Palette = Palette.GROVE


class ProfileWrite(ProfileFields, RequestBody):
    """The whole profile (PUT replaces every field). `id` is only used when it is created."""

    id: uuid.UUID | None = None


class ProfileRead(SyncedRead):
    first_name: str
    last_name: str | None
    locale: Locale
    timezone: str
    city: str | None
    theme: Theme
    palette: Palette


class ProfileSyncRow(ProfileFields, SyncRow):
    """The profile as sent by a device through sync."""
