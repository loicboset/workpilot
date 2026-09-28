"""Sync bookkeeping (server only, ADR 0025)."""

from sqlalchemy import BigInteger, CheckConstraint, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class SyncState(Base):
    """One row holding the last revision number handed out.

    A trigger on every synced table bumps it inside each write transaction. Updating this
    single row makes concurrent writers wait for each other, so revisions become visible in
    order and a pull can never skip a change.
    """

    __tablename__ = "sync_state"
    __table_args__ = (CheckConstraint("id = 1", name="single_row"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)
    revision: Mapped[int] = mapped_column(BigInteger, server_default="0")
