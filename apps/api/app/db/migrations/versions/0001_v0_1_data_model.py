"""v0.1 data model

Revision ID: 0001
Revises:
Create Date: 2026-09-28 14:30:04.898398
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "ai_settings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("provider", sa.Text(), nullable=True),
        sa.Column("base_url", sa.Text(), nullable=True),
        sa.Column("model", sa.Text(), nullable=True),
        sa.Column("api_key_encrypted", sa.Text(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_ai_settings")),
    )
    op.create_table(
        "ideas",
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_ideas")),
    )
    op.create_table(
        "north_stars",
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("target_date", sa.Date(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_north_stars")),
    )
    op.create_table(
        "profiles",
        sa.Column("first_name", sa.Text(), nullable=False),
        sa.Column("last_name", sa.Text(), nullable=True),
        sa.Column(
            "locale",
            sa.Enum("en", "fr", "es", name="locale", native_enum=False, length=20),
            nullable=False,
        ),
        sa.Column("timezone", sa.String(length=64), nullable=False),
        sa.Column("city", sa.Text(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("locale IN ('en', 'fr', 'es')", name=op.f("ck_profiles_locale")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_profiles")),
    )
    op.create_table(
        "prompts",
        sa.Column("key", sa.Text(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("key", name=op.f("pk_prompts")),
    )
    op.create_table(
        "push_subscriptions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("endpoint", sa.Text(), nullable=False),
        sa.Column("p256dh_key", sa.Text(), nullable=False),
        sa.Column("auth_key", sa.Text(), nullable=False),
        sa.Column("device_name", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_push_subscriptions")),
        sa.UniqueConstraint("endpoint", name=op.f("uq_push_subscriptions_endpoint")),
    )
    op.create_table(
        "review_templates",
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column(
            "kind",
            sa.Enum("daily", "weekly", "monthly", name="reviewkind", native_enum=False, length=20),
            nullable=False,
        ),
        sa.Column("questions", sa.JSON(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "kind IN ('daily', 'weekly', 'monthly')", name=op.f("ck_review_templates_kind")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_review_templates")),
    )
    op.create_table(
        "ticker_messages",
        sa.Column(
            "kind",
            sa.Enum(
                "insight",
                "tip",
                "guidance",
                "nudge",
                "quote",
                name="tickerkind",
                native_enum=False,
                length=20,
            ),
            nullable=False,
        ),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "kind IN ('insight', 'tip', 'guidance', 'nudge', 'quote')",
            name=op.f("ck_ticker_messages_kind"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_ticker_messages")),
    )
    op.create_table(
        "journal_entries",
        sa.Column("entry_date", sa.Date(), nullable=False),
        sa.Column(
            "kind",
            sa.Enum(
                "free",
                "daily",
                "weekly",
                "monthly",
                name="journalkind",
                native_enum=False,
                length=20,
            ),
            nullable=False,
        ),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("review_template_id", sa.Uuid(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "kind IN ('free', 'daily', 'weekly', 'monthly')", name=op.f("ck_journal_entries_kind")
        ),
        sa.ForeignKeyConstraint(
            ["review_template_id"],
            ["review_templates.id"],
            name=op.f("fk_journal_entries_review_template_id_review_templates"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_journal_entries")),
    )
    op.create_index(
        op.f("ix_journal_entries_entry_date"), "journal_entries", ["entry_date"], unique=False
    )
    op.create_index(
        op.f("ix_journal_entries_review_template_id"),
        "journal_entries",
        ["review_template_id"],
        unique=False,
    )
    op.create_table(
        "milestones",
        sa.Column("north_star_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("target_date", sa.Date(), nullable=True),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["north_star_id"],
            ["north_stars.id"],
            name=op.f("fk_milestones_north_star_id_north_stars"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_milestones")),
    )
    op.create_index(
        op.f("ix_milestones_north_star_id"), "milestones", ["north_star_id"], unique=False
    )
    op.create_table(
        "notes",
        sa.Column("title", sa.Text(), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("milestone_id", sa.Uuid(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["milestone_id"],
            ["milestones.id"],
            name=op.f("fk_notes_milestone_id_milestones"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_notes")),
    )
    op.create_index(op.f("ix_notes_milestone_id"), "notes", ["milestone_id"], unique=False)
    op.create_table(
        "time_blocks",
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("start_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("milestone_id", sa.Uuid(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("end_at > start_at", name=op.f("ck_time_blocks_end_after_start")),
        sa.ForeignKeyConstraint(
            ["milestone_id"],
            ["milestones.id"],
            name=op.f("fk_time_blocks_milestone_id_milestones"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_time_blocks")),
    )
    op.create_index(
        op.f("ix_time_blocks_milestone_id"), "time_blocks", ["milestone_id"], unique=False
    )
    op.create_index(op.f("ix_time_blocks_start_at"), "time_blocks", ["start_at"], unique=False)
    op.create_table(
        "todos",
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("milestone_id", sa.Uuid(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["milestone_id"],
            ["milestones.id"],
            name=op.f("fk_todos_milestone_id_milestones"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_todos")),
    )
    op.create_index(op.f("ix_todos_due_date"), "todos", ["due_date"], unique=False)
    op.create_index(op.f("ix_todos_milestone_id"), "todos", ["milestone_id"], unique=False)
    op.create_table(
        "reminders",
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("remind_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("recurrence", sa.Text(), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("todo_id", sa.Uuid(), nullable=True),
        sa.Column("time_block_id", sa.Uuid(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["time_block_id"],
            ["time_blocks.id"],
            name=op.f("fk_reminders_time_block_id_time_blocks"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["todo_id"], ["todos.id"], name=op.f("fk_reminders_todo_id_todos"), ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_reminders")),
    )
    op.create_index(op.f("ix_reminders_remind_at"), "reminders", ["remind_at"], unique=False)
    op.create_index(
        op.f("ix_reminders_time_block_id"), "reminders", ["time_block_id"], unique=False
    )
    op.create_index(op.f("ix_reminders_todo_id"), "reminders", ["todo_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_reminders_todo_id"), table_name="reminders")
    op.drop_index(op.f("ix_reminders_time_block_id"), table_name="reminders")
    op.drop_index(op.f("ix_reminders_remind_at"), table_name="reminders")
    op.drop_table("reminders")
    op.drop_index(op.f("ix_todos_milestone_id"), table_name="todos")
    op.drop_index(op.f("ix_todos_due_date"), table_name="todos")
    op.drop_table("todos")
    op.drop_index(op.f("ix_time_blocks_start_at"), table_name="time_blocks")
    op.drop_index(op.f("ix_time_blocks_milestone_id"), table_name="time_blocks")
    op.drop_table("time_blocks")
    op.drop_index(op.f("ix_notes_milestone_id"), table_name="notes")
    op.drop_table("notes")
    op.drop_index(op.f("ix_milestones_north_star_id"), table_name="milestones")
    op.drop_table("milestones")
    op.drop_index(op.f("ix_journal_entries_review_template_id"), table_name="journal_entries")
    op.drop_index(op.f("ix_journal_entries_entry_date"), table_name="journal_entries")
    op.drop_table("journal_entries")
    op.drop_table("ticker_messages")
    op.drop_table("review_templates")
    op.drop_table("push_subscriptions")
    op.drop_table("prompts")
    op.drop_table("profiles")
    op.drop_table("north_stars")
    op.drop_table("ideas")
    op.drop_table("ai_settings")
