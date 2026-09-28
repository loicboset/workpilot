"""The tables that sync to devices, and how each one is read and written."""

from dataclasses import dataclass

from app.common import SyncedRead, SyncRow
from app.db.base import SyncedMixin
from app.db.models import (
    Idea,
    JournalEntry,
    Milestone,
    NorthStar,
    Note,
    Profile,
    Reminder,
    ReviewTemplate,
    TickerMessage,
    TimeBlock,
    Todo,
)
from app.domain.ideas.schemas import IdeaRead, IdeaSyncRow
from app.domain.journal_entries.schemas import JournalEntryRead, JournalEntrySyncRow
from app.domain.milestones.schemas import MilestoneRead, MilestoneSyncRow
from app.domain.north_star.schemas import NorthStarRead, NorthStarSyncRow
from app.domain.notes.schemas import NoteRead, NoteSyncRow
from app.domain.profile.schemas import ProfileRead, ProfileSyncRow
from app.domain.reminders.schemas import ReminderRead, ReminderSyncRow
from app.domain.review_templates.schemas import ReviewTemplateRead, ReviewTemplateSyncRow
from app.domain.ticker_messages.schemas import TickerMessageRead
from app.domain.time_blocks.schemas import TimeBlockRead, TimeBlockSyncRow
from app.domain.todos.schemas import TodoRead, TodoSyncRow


@dataclass(frozen=True)
class SyncedTable:
    name: str
    model: type[SyncedMixin]
    read_schema: type[SyncedRead]  # the shape sent to devices
    row_schema: type[SyncRow] | None  # the shape accepted from devices; None = read only


# In dependency order: a table only links to tables listed above it, so pushed changes are
# applied in this order.
SYNCED_TABLES: tuple[SyncedTable, ...] = (
    SyncedTable("profiles", Profile, ProfileRead, ProfileSyncRow),
    SyncedTable("north_stars", NorthStar, NorthStarRead, NorthStarSyncRow),
    SyncedTable("milestones", Milestone, MilestoneRead, MilestoneSyncRow),
    SyncedTable("review_templates", ReviewTemplate, ReviewTemplateRead, ReviewTemplateSyncRow),
    SyncedTable("todos", Todo, TodoRead, TodoSyncRow),
    SyncedTable("time_blocks", TimeBlock, TimeBlockRead, TimeBlockSyncRow),
    SyncedTable("reminders", Reminder, ReminderRead, ReminderSyncRow),
    SyncedTable("ideas", Idea, IdeaRead, IdeaSyncRow),
    SyncedTable("notes", Note, NoteRead, NoteSyncRow),
    SyncedTable("journal_entries", JournalEntry, JournalEntryRead, JournalEntrySyncRow),
    SyncedTable("ticker_messages", TickerMessage, TickerMessageRead, None),  # written by the AI
)

TABLES_BY_NAME = {table.name: table for table in SYNCED_TABLES}
