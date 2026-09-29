"""Spaces: separate worlds in one install (ADR 0031).

Every row that belongs to a space gets `space_id`. Links between rows become two-column
foreign keys, so a link from one space to another is refused. AI settings and prompts are kept
per space, and the palette moves from the profile to the space.

An install that already has data gets a first space, "My space" in the profile's language,
holding all of it. Setting `space_id` moves every row forward in the sync order, so every
device pulls it again, now with its space. A new install gets no space: onboarding makes one.

Downgrade merges every space back into one world and keeps the first space's AI settings.

Revision ID: 0007
Revises: 0006
Create Date: 2026-09-30
"""

import uuid
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0007"
down_revision: str | None = "0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# The synced tables whose rows belong to a space, parents first.
SPACE_TABLES = (
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
# Tables other rows link to: `(space_id, id)` becomes unique so a link can include the space.
LINKED_TABLES = ("north_stars", "milestones", "review_templates", "todos", "time_blocks")
# (table, link column, linked table, what deleting the linked row does)
LINKS = (
    ("milestones", "north_star_id", "north_stars", "CASCADE"),
    ("todos", "milestone_id", "milestones", "SET NULL"),
    ("time_blocks", "milestone_id", "milestones", "SET NULL"),
    ("notes", "milestone_id", "milestones", "SET NULL"),
    ("reminders", "todo_id", "todos", "SET NULL"),
    ("reminders", "time_block_id", "time_blocks", "SET NULL"),
    ("journal_entries", "review_template_id", "review_templates", "SET NULL"),
)
# The first space's name and URL name, in the profile's language.
FIRST_SPACE = {
    "en": ("My space", "my-space"),
    "fr": ("Mon espace", "mon-espace"),
    "es": ("Mi espacio", "mi-espacio"),
}
PALETTES = "'grove', 'lake', 'heather', 'olive', 'birch'"


def upgrade() -> None:
    _create_spaces_table()
    first_space_id = _create_first_space()

    for table in SPACE_TABLES:
        _add_space_id(table, first_space_id)
    for table in LINKED_TABLES:
        op.create_unique_constraint(op.f(f"uq_{table}_space_id"), table, ["space_id", "id"])
    for table, column, linked, on_delete in LINKS:
        op.drop_constraint(op.f(f"fk_{table}_{column}_{linked}"), table, type_="foreignkey")
        op.create_foreign_key(
            op.f(f"fk_{table}_space_id_{linked}"),
            table,
            linked,
            ["space_id", column],
            ["space_id", "id"],
            ondelete="CASCADE" if on_delete == "CASCADE" else f"SET NULL ({column})",
        )

    # AI settings: one row per space instead of the single row 1.
    _add_space_id_key("ai_settings", first_space_id, keep=[])
    op.drop_column("ai_settings", "id")
    # Prompts: edited per space.
    _add_space_id_key("prompts", first_space_id, keep=["key"])

    op.drop_constraint(op.f("ck_profiles_palette"), "profiles", type_="check")
    op.drop_column("profiles", "palette")


def downgrade() -> None:
    op.add_column(
        "profiles",
        sa.Column("palette", sa.String(20), nullable=False, server_default="grove"),
    )
    op.execute(
        "UPDATE profiles SET palette = first.palette "
        "FROM (SELECT palette FROM spaces ORDER BY created_at LIMIT 1) AS first"
    )
    op.alter_column("profiles", "palette", server_default=None)
    op.create_check_constraint(op.f("ck_profiles_palette"), "profiles", f"palette IN ({PALETTES})")

    # Only the first space's AI settings and prompts are kept.
    first_space = "(SELECT id FROM spaces ORDER BY created_at LIMIT 1)"
    for table in ("prompts", "ai_settings"):
        op.execute(f"DELETE FROM {table} WHERE space_id <> {first_space}")
        op.drop_constraint(op.f(f"fk_{table}_space_id_spaces"), table, type_="foreignkey")
        op.drop_constraint(op.f(f"pk_{table}"), table, type_="primary")
    op.drop_column("prompts", "space_id")
    op.create_primary_key(op.f("pk_prompts"), "prompts", ["key"])
    op.add_column("ai_settings", sa.Column("id", sa.Integer(), nullable=True))
    op.execute("UPDATE ai_settings SET id = 1")
    op.alter_column("ai_settings", "id", nullable=False)
    op.drop_column("ai_settings", "space_id")
    op.create_primary_key(op.f("pk_ai_settings"), "ai_settings", ["id"])

    for table, column, linked, on_delete in reversed(LINKS):
        op.drop_constraint(op.f(f"fk_{table}_space_id_{linked}"), table, type_="foreignkey")
        op.create_foreign_key(
            op.f(f"fk_{table}_{column}_{linked}"),
            table,
            linked,
            [column],
            ["id"],
            ondelete=on_delete,
        )
    for table in reversed(LINKED_TABLES):
        op.drop_constraint(op.f(f"uq_{table}_space_id"), table, type_="unique")
    for table in reversed(SPACE_TABLES):
        op.drop_index(op.f(f"ix_{table}_space_id"), table_name=table)
        op.drop_constraint(op.f(f"fk_{table}_space_id_spaces"), table, type_="foreignkey")
        op.drop_column(table, "space_id")

    op.execute("DROP TRIGGER assign_sync_revision ON spaces")
    op.drop_table("spaces")


def _create_spaces_table() -> None:
    op.create_table(
        "spaces",
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("slug", sa.Text(), nullable=False),
        sa.Column("palette", sa.String(20), nullable=False),
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revision", sa.BigInteger(), server_default="0", nullable=False),
        sa.CheckConstraint(f"palette IN ({PALETTES})", name=op.f("ck_spaces_palette")),
        sa.CheckConstraint(
            "slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) <= 60",
            name=op.f("ck_spaces_slug_format"),
        ),
        sa.CheckConstraint(
            "slug NOT IN ('api', 'onboarding', 'sign-in')",
            name=op.f("ck_spaces_slug_not_reserved"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_spaces")),
        sa.UniqueConstraint("slug", name=op.f("uq_spaces_slug")),
    )
    op.create_index(op.f("ix_spaces_revision"), "spaces", ["revision"], unique=False)
    op.execute(
        "CREATE TRIGGER assign_sync_revision BEFORE INSERT OR UPDATE ON spaces "
        "FOR EACH ROW EXECUTE FUNCTION assign_sync_revision()"
    )


def _create_first_space() -> uuid.UUID | None:
    """The space for the data already there, or None on a new install."""
    connection = op.get_bind()
    tables = ("profiles", *SPACE_TABLES, "ai_settings", "prompts")
    has_data = any(
        connection.scalar(sa.text(f"SELECT EXISTS (SELECT 1 FROM {table})")) for table in tables
    )
    if not has_data:
        return None

    profile = connection.execute(
        sa.text(
            "SELECT locale, palette FROM profiles WHERE deleted_at IS NULL "
            "ORDER BY created_at LIMIT 1"
        )
    ).first()
    locale, palette = profile if profile else ("en", "grove")
    name, slug = FIRST_SPACE.get(locale, FIRST_SPACE["en"])
    space_id = uuid.uuid4()
    connection.execute(
        sa.text(
            "INSERT INTO spaces (id, name, slug, palette, created_at, updated_at) "
            "VALUES (:id, :name, :slug, :palette, now(), now())"
        ),
        {"id": space_id, "name": name, "slug": slug, "palette": palette},
    )
    return space_id


def _add_space_id(table: str, first_space_id: uuid.UUID | None) -> None:
    op.add_column(table, sa.Column("space_id", sa.Uuid(), nullable=True))
    if first_space_id is not None:
        # The sync trigger gives each row a new revision: devices pull it again.
        op.get_bind().execute(
            sa.text(f"UPDATE {table} SET space_id = :space_id"), {"space_id": first_space_id}
        )
    op.alter_column(table, "space_id", nullable=False)
    op.create_foreign_key(
        op.f(f"fk_{table}_space_id_spaces"),
        table,
        "spaces",
        ["space_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index(op.f(f"ix_{table}_space_id"), table, ["space_id"], unique=False)


def _add_space_id_key(table: str, first_space_id: uuid.UUID | None, keep: list[str]) -> None:
    """A server-only table keyed by space (plus the columns in `keep`)."""
    op.add_column(table, sa.Column("space_id", sa.Uuid(), nullable=True))
    if first_space_id is not None:
        op.get_bind().execute(
            sa.text(f"UPDATE {table} SET space_id = :space_id"), {"space_id": first_space_id}
        )
    op.alter_column(table, "space_id", nullable=False)
    op.drop_constraint(op.f(f"pk_{table}"), table, type_="primary")
    op.create_primary_key(op.f(f"pk_{table}"), table, ["space_id", *keep])
    op.create_foreign_key(
        op.f(f"fk_{table}_space_id_spaces"),
        table,
        "spaces",
        ["space_id"],
        ["id"],
        ondelete="CASCADE",
    )
