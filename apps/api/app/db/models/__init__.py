"""SQLAlchemy models (ADR 0021, docs/data-model.md).

Every model module is imported here so Alembic sees all tables.
"""

from app.db.base import Base
from app.db.models.ai import AISettings, Prompt, TickerMessage
from app.db.models.capture import Idea, Note
from app.db.models.direction import Milestone, NorthStar
from app.db.models.planning import Reminder, TimeBlock, Todo
from app.db.models.profile import Profile
from app.db.models.push import PushSubscription
from app.db.models.review import JournalEntry, ReviewTemplate
from app.db.models.space import Space
from app.db.models.sync import SyncState

__all__ = [
    "AISettings",
    "Base",
    "Idea",
    "JournalEntry",
    "Milestone",
    "NorthStar",
    "Note",
    "Profile",
    "Prompt",
    "PushSubscription",
    "Reminder",
    "ReviewTemplate",
    "Space",
    "SyncState",
    "TickerMessage",
    "TimeBlock",
    "Todo",
]
