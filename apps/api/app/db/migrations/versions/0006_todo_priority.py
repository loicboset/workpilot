"""Todo priority: 1 (most important) to 3, or none (ADR 0030).

Existing todos get no priority.

Revision ID: 0006
Revises: 0005
Create Date: 2026-09-29
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0006"
down_revision: str | None = "0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("todos", sa.Column("priority", sa.SmallInteger(), nullable=True))
    op.create_check_constraint(
        op.f("ck_todos_priority_1_to_3"), "todos", "priority BETWEEN 1 AND 3"
    )


def downgrade() -> None:
    op.drop_constraint(op.f("ck_todos_priority_1_to_3"), "todos", type_="check")
    op.drop_column("todos", "priority")
