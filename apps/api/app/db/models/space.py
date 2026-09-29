"""Spaces: separate worlds in one install, like browser profiles (ADR 0031)."""

from datetime import datetime

from sqlalchemy import CheckConstraint, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, SyncedMixin
from app.db.enums import Palette, one_of, text_enum

# The name in URLs: lowercase letters and digits, words joined by "-", e.g. "cote-pro".
SLUG_PATTERN = r"^[a-z0-9]+(-[a-z0-9]+)*$"
SLUG_MAX_LENGTH = 60
# Paths the app already uses at the top level: a space can't take them.
RESERVED_SLUGS = ("api", "onboarding", "sign-in")


class Space(SyncedMixin, Base):
    """A space: its own North Star, planning, notes, palette and AI. Archived, never deleted."""

    __tablename__ = "spaces"
    __table_args__ = (
        one_of("palette", Palette),
        CheckConstraint(
            f"slug ~ '{SLUG_PATTERN}' AND char_length(slug) <= {SLUG_MAX_LENGTH}",
            name="slug_format",
        ),
        CheckConstraint(
            "slug NOT IN (" + ", ".join(f"'{slug}'" for slug in RESERVED_SLUGS) + ")",
            name="slug_not_reserved",
        ),
    )

    name: Mapped[str] = mapped_column(Text)
    # Unique, archived spaces included, so restoring one never clashes with another.
    slug: Mapped[str] = mapped_column(Text, unique=True)
    palette: Mapped[Palette] = mapped_column(text_enum(Palette), default=Palette.GROVE)
    archived_at: Mapped[datetime | None]
