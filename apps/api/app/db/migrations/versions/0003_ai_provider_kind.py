"""AI provider kind (ADR 0026).

`ai_settings.provider` only holds the kinds WorkPilot supports.

Revision ID: 0003
Revises: 0002
Create Date: 2026-09-28
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

PROVIDER_KIND = sa.Enum(
    "openai_compatible", "anthropic", name="aiproviderkind", native_enum=False, length=20
)


def upgrade() -> None:
    op.alter_column(
        "ai_settings",
        "provider",
        existing_type=sa.Text(),
        type_=PROVIDER_KIND,
        existing_nullable=True,
    )
    op.create_check_constraint(
        op.f("ck_ai_settings_provider"),
        "ai_settings",
        "provider IN ('openai_compatible', 'anthropic')",
    )


def downgrade() -> None:
    op.drop_constraint(op.f("ck_ai_settings_provider"), "ai_settings", type_="check")
    op.alter_column(
        "ai_settings",
        "provider",
        existing_type=PROVIDER_KIND,
        type_=sa.Text(),
        existing_nullable=True,
    )
