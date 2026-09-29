"""Profile theme: light, dark, or the device's setting.

Existing profiles get `system`: they follow the device's setting.

Revision ID: 0004
Revises: 0003
Create Date: 2026-09-29
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

THEME = sa.Enum("system", "light", "dark", name="theme", native_enum=False, length=20)


def upgrade() -> None:
    # The server default fills the existing rows, then goes: the app sets the value (as for
    # the other columns).
    op.add_column("profiles", sa.Column("theme", THEME, nullable=False, server_default="system"))
    op.alter_column("profiles", "theme", server_default=None)
    op.create_check_constraint(
        op.f("ck_profiles_theme"), "profiles", "theme IN ('system', 'light', 'dark')"
    )


def downgrade() -> None:
    op.drop_constraint(op.f("ck_profiles_theme"), "profiles", type_="check")
    op.drop_column("profiles", "theme")
