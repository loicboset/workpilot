"""Request and response shapes for push subscriptions."""

import uuid
from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints

from app.common import Title

# The push service URL the browser gives (always https). Stored exactly as sent.
PushEndpoint = Annotated[str, StringConstraints(pattern=r"^https://", max_length=2000)]


class PushPublicKey(BaseModel):
    public_key: str  # base64url, uncompressed P-256 point


class PushKeys(BaseModel):
    p256dh: str
    auth: str


class PushSubscriptionCreate(BaseModel):
    """What the browser's `PushSubscription.toJSON()` returns, plus an optional device name.

    Unlike other request bodies, unknown fields (e.g. `expirationTime`) are ignored.
    """

    endpoint: PushEndpoint
    keys: PushKeys
    device_name: Title | None = None


class PushSubscriptionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    endpoint: str
    device_name: str | None
    created_at: datetime
