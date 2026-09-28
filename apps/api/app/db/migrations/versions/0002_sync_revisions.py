"""Sync revisions (ADR 0025).

Every synced table gets a revision number, set by a trigger on each insert and update.

Revision ID: 0002
Revises: 0001
Create Date: 2026-09-28
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

SYNCED_TABLES = (
    "profiles",
    "north_stars",
    "milestones",
    "review_templates",
    "todos",
    "time_blocks",
    "reminders",
    "ideas",
    "notes",
    "journal_entries",
    "ticker_messages",
)

# Takes the next number from the single sync_state row. The row lock is held until the
# transaction ends, so writers are serialised and revisions become visible in order.
ASSIGN_REVISION = """
CREATE FUNCTION assign_sync_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    UPDATE sync_state SET revision = revision + 1 WHERE id = 1
    RETURNING revision INTO NEW.revision;
    RETURN NEW;
END
$$;
"""


def upgrade() -> None:
    op.create_table(
        "sync_state",
        sa.Column("id", sa.Integer(), autoincrement=False, nullable=False),
        sa.Column("revision", sa.BigInteger(), server_default="0", nullable=False),
        sa.CheckConstraint("id = 1", name=op.f("ck_sync_state_single_row")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_sync_state")),
    )
    op.execute("INSERT INTO sync_state (id, revision) VALUES (1, 0)")
    op.execute(ASSIGN_REVISION)

    for table in SYNCED_TABLES:
        op.add_column(
            table, sa.Column("revision", sa.BigInteger(), server_default="0", nullable=False)
        )
        op.create_index(op.f(f"ix_{table}_revision"), table, ["revision"], unique=False)
        op.execute(
            f"CREATE TRIGGER assign_sync_revision BEFORE INSERT OR UPDATE ON {table} "
            "FOR EACH ROW EXECUTE FUNCTION assign_sync_revision()"
        )
        # Give existing rows a revision (the trigger replaces the value).
        op.execute(f"UPDATE {table} SET revision = 0")


def downgrade() -> None:
    for table in reversed(SYNCED_TABLES):
        op.execute(f"DROP TRIGGER assign_sync_revision ON {table}")
        op.drop_index(op.f(f"ix_{table}_revision"), table_name=table)
        op.drop_column(table, "revision")
    op.execute("DROP FUNCTION assign_sync_revision()")
    op.drop_table("sync_state")
