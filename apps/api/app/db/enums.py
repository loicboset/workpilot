"""Fixed lists of values used by the models."""

from enum import StrEnum

from sqlalchemy import CheckConstraint, Enum


class Locale(StrEnum):
    EN = "en"
    FR = "fr"
    ES = "es"


class Theme(StrEnum):
    """Light or dark colours. `system` follows the device's setting."""

    SYSTEM = "system"
    LIGHT = "light"
    DARK = "dark"


class Palette(StrEnum):
    """The app's colours, in light and dark alike. `grove`, the forest's greens, by default."""

    GROVE = "grove"
    LAKE = "lake"
    HEATHER = "heather"
    OLIVE = "olive"
    BIRCH = "birch"


class JournalKind(StrEnum):
    FREE = "free"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class ReviewKind(StrEnum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class AIProviderKind(StrEnum):
    """How WorkPilot talks to the AI (ADR 0026)."""

    OPENAI_COMPATIBLE = "openai_compatible"  # LM Studio, Ollama, OpenAI, OpenRouter, Gemini…
    ANTHROPIC = "anthropic"  # Claude, through Anthropic's own API


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
        length=20,  # longest value today: "openai_compatible", 17 characters
        # Store the values ("en"), not the member names ("EN").
        values_callable=lambda members: [member.value for member in members],
    )


def one_of(column: str, enum: type[StrEnum]) -> CheckConstraint:
    """A check constraint: `column` only holds the enum's values."""
    values = ", ".join(f"'{member.value}'" for member in enum)
    return CheckConstraint(f"{column} IN ({values})", name=column)
