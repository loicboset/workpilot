"""The user's profile (one row)."""

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, SyncedMixin
from app.db.enums import Locale, Palette, Theme, one_of, text_enum


class Profile(SyncedMixin, Base):
    __tablename__ = "profiles"
    __table_args__ = (
        one_of("locale", Locale),
        one_of("theme", Theme),
        one_of("palette", Palette),
    )

    first_name: Mapped[str] = mapped_column(Text)
    last_name: Mapped[str | None] = mapped_column(Text)
    locale: Mapped[Locale] = mapped_column(text_enum(Locale), default=Locale.EN)
    timezone: Mapped[str] = mapped_column(String(64), default="UTC")
    city: Mapped[str | None] = mapped_column(Text)
    theme: Mapped[Theme] = mapped_column(text_enum(Theme), default=Theme.SYSTEM)
    palette: Mapped[Palette] = mapped_column(text_enum(Palette), default=Palette.GROVE)
