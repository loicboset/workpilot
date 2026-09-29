"""Response shape for ticker messages."""

from app.common import InSpaceRead
from app.db.enums import TickerKind


class TickerMessageRead(InSpaceRead):
    kind: TickerKind
    text: str
