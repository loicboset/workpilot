"""REST routes for ticker messages. Read only: the AI writes them (generation not built yet)."""

from typing import Annotated

from fastapi import APIRouter, Query

from app.common import select_rows
from app.db.models import TickerMessage
from app.db.session import SessionDep
from app.domain.ticker_messages.schemas import TickerMessageRead

router = APIRouter(prefix="/api/ticker-messages", tags=["ticker messages"])


@router.get("", response_model=list[TickerMessageRead])
def list_ticker_messages(
    session: SessionDep, limit: Annotated[int, Query(ge=1, le=50)] = 10
) -> list[TickerMessage]:
    """The latest messages, newest first."""
    stmt = select_rows(TickerMessage).order_by(TickerMessage.created_at.desc()).limit(limit)
    return list(session.scalars(stmt))
