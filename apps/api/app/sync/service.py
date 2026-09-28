"""Pull and push, following the design in ADR 0025.

- Pull: every row whose revision is above the device's cursor, deletions included.
- Push: most recent edit wins, judged by `updated_at`. A device clock set in the future is
  brought back to the server's time, so it can't win forever.
"""

from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.common import SyncRow
from app.db.base import SyncedMixin, utcnow
from app.sync.schemas import Change, PullResponse, PushResponse, RejectedChange
from app.sync.tables import SYNCED_TABLES, TABLES_BY_NAME, SyncedTable

_POSITION = {table.name: position for position, table in enumerate(SYNCED_TABLES)}


def pull_changes(session: Session, since: int, limit: int) -> PullResponse:
    changed: list[tuple[SyncedTable, SyncedMixin]] = []
    for table in SYNCED_TABLES:
        # limit + 1 per table is enough to find the overall first `limit` and know if more wait.
        stmt = (
            select(table.model)
            .where(table.model.revision > since)
            .order_by(table.model.revision)
            .limit(limit + 1)
        )
        changed.extend((table, row) for row in session.scalars(stmt))

    changed.sort(key=lambda table_and_row: table_and_row[1].revision)
    page = changed[:limit]
    return PullResponse(
        changes=[_as_change(table, row) for table, row in page],
        cursor=page[-1][1].revision if page else since,
        has_more=len(changed) > limit,
    )


def _as_change(table: SyncedTable, row: SyncedMixin) -> Change:
    """A row in the same JSON shape the REST API returns for it."""
    return Change(
        table=table.name, row=table.read_schema.model_validate(row).model_dump(mode="json")
    )


def push_changes(session: Session, changes: list[Change]) -> PushResponse:
    """Apply a device's changes. Each one succeeds or fails on its own."""
    response = PushResponse()
    for change in sorted(changes, key=_dependency_order):
        table = TABLES_BY_NAME.get(change.table)
        if table is None or table.row_schema is None:
            response.rejected.append(_rejected(change, "unknown or read-only table"))
            continue
        try:
            row = table.row_schema.model_validate(change.row)
        except ValidationError:
            response.rejected.append(_rejected(change, "invalid row"))
            continue
        try:
            with session.begin_nested():  # a failure only undoes this one change
                written = _write_if_newer(session, table.model, row)
        except IntegrityError:
            response.rejected.append(_rejected(change, "invalid reference or value"))
            continue
        (response.applied if written else response.skipped).append(str(row.id))
    session.commit()
    return response


def _write_if_newer(session: Session, model: type[SyncedMixin], row: SyncRow) -> bool:
    """Insert or update the row, unless the server's version is as recent. True if written."""
    values = row.model_dump()
    values["updated_at"] = min(values["updated_at"], utcnow())
    existing = session.get(model, row.id)
    if existing is None:
        session.add(model(**values))
    elif values["updated_at"] > existing.updated_at:
        for field, value in values.items():
            setattr(existing, field, value)
    else:
        return False
    session.flush()
    return True


def _dependency_order(change: Change) -> int:
    """Parents first, e.g. a milestone before the todos linked to it. Unknown tables last."""
    return _POSITION.get(change.table, len(_POSITION))


def _rejected(change: Change, reason: str) -> RejectedChange:
    row_id = change.row.get("id")
    return RejectedChange(table=change.table, id=str(row_id) if row_id else None, reason=reason)
