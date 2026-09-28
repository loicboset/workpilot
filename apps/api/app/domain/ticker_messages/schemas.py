"""Response shape for ticker messages."""

from app.common import SyncedRead
from app.db.enums import TickerKind


class TickerMessageRead(SyncedRead):
    kind: TickerKind
    text: str
