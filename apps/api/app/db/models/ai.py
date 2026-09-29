"""AI: ticker messages (synced) plus AI settings and prompts (server only), per space."""

import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, InSpaceMixin, utcnow
from app.db.enums import AIProviderKind, TickerKind, one_of, text_enum


class TickerMessage(InSpaceMixin, Base):
    """A message in the header ticker. AI-generated only (ADR 0016)."""

    __tablename__ = "ticker_messages"
    __table_args__ = (one_of("kind", TickerKind),)

    kind: Mapped[TickerKind] = mapped_column(text_enum(TickerKind))
    text: Mapped[str] = mapped_column(Text)


class AISettings(Base):
    """Server only, one row per space. The API key is encrypted and never returned by the API."""

    __tablename__ = "ai_settings"
    __table_args__ = (one_of("provider", AIProviderKind),)

    space_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("spaces.id", ondelete="CASCADE"), primary_key=True
    )
    provider: Mapped[AIProviderKind | None] = mapped_column(text_enum(AIProviderKind))
    base_url: Mapped[str | None] = mapped_column(Text)
    model: Mapped[str | None] = mapped_column(Text)
    api_key_encrypted: Mapped[str | None] = mapped_column(Text)
    updated_at: Mapped[datetime] = mapped_column(default=utcnow, onupdate=utcnow)


class Prompt(Base):
    """Server only. A prompt the user edited in a space; defaults ship in app/ai/prompts/."""

    __tablename__ = "prompts"

    space_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("spaces.id", ondelete="CASCADE"), primary_key=True
    )
    key: Mapped[str] = mapped_column(Text, primary_key=True)
    body: Mapped[str] = mapped_column(Text)
    updated_at: Mapped[datetime] = mapped_column(default=utcnow, onupdate=utcnow)
