"""REST routes for a space's ticker messages. Devices only read them; the AI writes them
(ADR 0016)."""

from typing import Annotated

from fastapi import APIRouter, Query

from app.ai.service import ProviderDep
from app.ai.ticker import refresh_ticker
from app.common import select_in_space
from app.db.models import TickerMessage
from app.db.session import SessionDep
from app.domain.spaces.current import CurrentSpace
from app.domain.ticker_messages.schemas import TickerMessageRead

# Under /api/spaces/{space_id} (see main.py), like every resource of a space.
router = APIRouter(prefix="/ticker-messages", tags=["ticker messages"])


@router.get("", response_model=list[TickerMessageRead])
def list_ticker_messages(
    session: SessionDep, space: CurrentSpace, limit: Annotated[int, Query(ge=1, le=50)] = 10
) -> list[TickerMessage]:
    """The latest messages, newest first."""
    stmt = (
        select_in_space(TickerMessage, space.id)
        .order_by(TickerMessage.created_at.desc())
        .limit(limit)
    )
    return list(session.scalars(stmt))


@router.post("/refresh", response_model=list[TickerMessageRead])
def refresh_ticker_messages(
    session: SessionDep, space: CurrentSpace, provider: ProviderDep
) -> list[TickerMessage]:
    """New messages from the AI if the space's current ones are more than 6 hours old.

    The app calls this when a space's homepage opens. Answers 409 `ai_not_configured` without
    an AI provider.
    """
    return refresh_ticker(session, provider, space)
