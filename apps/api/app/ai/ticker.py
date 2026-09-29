"""The AI ticker (ADR 0016): five short, calm messages for the homepage header.

Refreshed when the app is opened and the messages are older than a few hours. No background
job: nothing needs to happen while the app is closed (ADR 0027). New messages reach every
device through sync; the previous ones are soft-deleted.
"""

import threading
from datetime import datetime, timedelta
from string import Template
from zoneinfo import ZoneInfo

from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.ai.providers import AIProvider
from app.ai.service import prompt_text
from app.common import get_singleton, select_rows
from app.db.base import utcnow
from app.db.enums import Locale, TickerKind
from app.db.models import Milestone, NorthStar, Profile, TickerMessage, TimeBlock, Todo

FRESH_FOR = timedelta(hours=6)
MESSAGE_COUNT = 5
LANGUAGE_NAMES = {Locale.EN: "English", Locale.FR: "French", Locale.ES: "Spanish"}

# Only one request asks the AI at a time; the others keep the current messages.
_generating = threading.Lock()


class TickerLine(BaseModel):
    kind: TickerKind
    text: str = Field(min_length=1, max_length=200)


class TickerAnswer(BaseModel):
    """The shape the model must answer in (structured output)."""

    messages: list[TickerLine] = Field(min_length=1, max_length=10)


def refresh_ticker(session: Session, provider: AIProvider) -> list[TickerMessage]:
    """Ask the AI for new messages if the current ones are stale. Returns the active messages."""
    current = _active_messages(session)
    if current and utcnow() - current[0].created_at < FRESH_FOR:
        return current
    if not _generating.acquire(blocking=False):
        return current
    try:
        answer = provider.generate(ticker_prompt(session), TickerAnswer)
        now = utcnow()
        for message in current:
            message.deleted_at = now
        fresh = [
            TickerMessage(kind=line.kind, text=line.text.strip())
            for line in answer.messages[:MESSAGE_COUNT]
        ]
        session.add_all(fresh)
        session.commit()
        return fresh
    finally:
        _generating.release()


def ticker_prompt(session: Session) -> str:
    """The ticker prompt, filled in with the user's name, direction and day."""
    profile = get_singleton(session, Profile)
    timezone = ZoneInfo(profile.timezone if profile else "UTC")
    context = {
        "first_name": profile.first_name if profile else "there",
        "language": LANGUAGE_NAMES[profile.locale] if profile else "English",
        "north_star": _north_star(session),
        "milestones": _milestones(session),
        "today": _today(session, timezone),
    }
    return Template(prompt_text(session, "ticker")).safe_substitute(context)


def _active_messages(session: Session) -> list[TickerMessage]:
    stmt = select_rows(TickerMessage).order_by(TickerMessage.created_at.desc())
    return list(session.scalars(stmt))


def _north_star(session: Session) -> str:
    north_star = get_singleton(session, NorthStar)
    if north_star is None:
        return "not set yet"
    return (
        f"{north_star.title}. {north_star.description}"
        if north_star.description
        else north_star.title
    )


def _milestones(session: Session) -> str:
    stmt = select_rows(Milestone).order_by(Milestone.position, Milestone.created_at)
    milestones = [
        f"{milestone.title} ({'reached' if milestone.completed_at else 'ahead'})"
        for milestone in session.scalars(stmt)
    ]
    return "; ".join(milestones) or "none yet"


def _today(session: Session, timezone: ZoneInfo) -> str:
    today = datetime.now(timezone).date()
    start = datetime.combine(today, datetime.min.time(), timezone)
    blocks = session.scalars(
        select_rows(TimeBlock)
        .where(TimeBlock.start_at >= start, TimeBlock.start_at < start + timedelta(days=1))
        .order_by(TimeBlock.start_at)
    )
    todos = session.scalars(
        select_rows(Todo)
        .where(Todo.due_date == today)
        .order_by(Todo.priority.is_(None), Todo.priority, Todo.created_at)
    )
    items = [f"{_clock(block.start_at, timezone)} {block.title}" for block in blocks]
    items += [f"todo: {todo.title}{_todo_details(todo)}" for todo in todos]
    return "; ".join(items) or "nothing planned yet"


def _todo_details(todo: Todo) -> str:
    details = [f"priority {todo.priority}"] if todo.priority else []
    if todo.completed_at:
        details.append("done")
    return f" ({', '.join(details)})" if details else ""


def _clock(moment: datetime, timezone: ZoneInfo) -> str:
    return moment.astimezone(timezone).strftime("%H:%M")
