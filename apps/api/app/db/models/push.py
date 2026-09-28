"""Devices registered for push notifications (server only)."""

import uuid
from datetime import datetime

from sqlalchemy import Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, utcnow


class PushSubscription(Base):
    """Server only. One row per device that accepted notifications (ADR 0011)."""

    __tablename__ = "push_subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    endpoint: Mapped[str] = mapped_column(Text, unique=True)
    p256dh_key: Mapped[str] = mapped_column(Text)
    auth_key: Mapped[str] = mapped_column(Text)
    device_name: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
