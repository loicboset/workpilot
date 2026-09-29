"""Profile palette: the app's colours (Grove, Lake, Heather, Olive, Birch).

Existing profiles get `grove`: the colours they had.

Revision ID: 0005
Revises: 0004
Create Date: 2026-09-29
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0005"
down_revision: str | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

PALETTE = sa.Enum(
    "grove", "lake", "heather", "olive", "birch", name="palette", native_enum=False, length=20
)


def upgrade() -> None:
    # The server default fills the existing rows, then goes: the app sets the value (as for
    # the other columns).
    op.add_column("profiles", sa.Column("palette", PALETTE, nullable=False, server_default="grove"))
    op.alter_column("profiles", "palette", server_default=None)
    op.create_check_constraint(
        op.f("ck_profiles_palette"),
        "profiles",
        "palette IN ('grove', 'lake', 'heather', 'olive', 'birch')",
    )


def downgrade() -> None:
    op.drop_constraint(op.f("ck_profiles_palette"), "profiles", type_="check")
    op.drop_column("profiles", "palette")
