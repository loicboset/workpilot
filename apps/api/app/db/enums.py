"""Fixed lists of values used by the models."""

from enum import StrEnum

from sqlalchemy import CheckConstraint, Enum


class Locale(StrEnum):
    EN = "en"
    FR = "fr"
    ES = "es"


class JournalKind(StrEnum):
    FREE = "free"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class ReviewKind(StrEnum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class TickerKind(StrEnum):
    INSIGHT = "insight"
    TIP = "tip"
    GUIDANCE = "guidance"
    NUDGE = "nudge"
    QUOTE = "quote"


def text_enum(enum: type[StrEnum]) -> Enum:
    """Store an enum's values as plain text. Pair it with `one_of()` to enforce the values."""
    return Enum(
        enum,
        native_enum=False,
        create_constraint=False,
        length=20,  # longest value today is 8 characters
        # Store the values ("en"), not the member names ("EN").
        values_callable=lambda members: [member.value for member in members],
    )


def one_of(column: str, enum: type[StrEnum]) -> CheckConstraint:
    """A check constraint: `column` only holds the enum's values."""
    values = ", ".join(f"'{member.value}'" for member in enum)
    return CheckConstraint(f"{column} IN ({values})", name=column)
