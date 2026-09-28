"""REST routes for ticker messages. Devices only read them; the AI writes them (ADR 0016)."""

from typing import Annotated

from fastapi import APIRouter, Query

from app.ai.service import ProviderDep
from app.ai.ticker import refresh_ticker
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


@router.post("/refresh", response_model=list[TickerMessageRead])
def refresh_ticker_messages(session: SessionDep, provider: ProviderDep) -> list[TickerMessage]:
    """New messages from the AI if the current ones are more than 6 hours old.

    The app calls this when it opens. Answers 409 `ai_not_configured` without an AI provider.
    """
    return refresh_ticker(session, provider)
