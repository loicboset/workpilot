"""The space a script writes to: `SPACE=work` (its URL name), or the first space."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Space


def find_space(session: Session, slug: str | None) -> Space | None:
    """The active space with this URL name, or the first active space without one."""
    stmt = select(Space).where(Space.deleted_at.is_(None), Space.archived_at.is_(None))
    if slug:
        stmt = stmt.where(Space.slug == slug)
    return session.scalars(stmt.order_by(Space.created_at)).first()
