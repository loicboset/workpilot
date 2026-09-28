"""Request and response shapes for AI settings and prompts."""

from typing import Annotated

from pydantic import BaseModel, StringConstraints

from app.common import LongText, PartialUpdate, RequestBody
from app.db.enums import AIProviderKind

Setting = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=500)]


class AISettingsRead(BaseModel):
    """The API key itself is never returned, only whether one is stored."""

    provider: AIProviderKind | None
    base_url: str | None
    model: str | None
    has_api_key: bool


class AISettingsUpdate(PartialUpdate):
    """Send only what changes. `api_key` is write-only; send null to remove it."""

    provider: AIProviderKind | None = None
    base_url: Setting | None = None
    model: Setting | None = None
    api_key: Setting | None = None


class PromptRead(BaseModel):
    key: str
    body: str
    is_default: bool


class PromptWrite(RequestBody):
    body: LongText
