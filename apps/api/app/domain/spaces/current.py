"""The space a request is about: every route under `/api/spaces/{space_id}` (ADR 0031)."""

import uuid
from typing import Annotated

from fastapi import Depends

from app.common import get_active_or_404
from app.db.models import Space
from app.db.session import SessionDep


def current_space(space_id: uuid.UUID, session: SessionDep) -> Space:
    """The space in the URL, archived or not; 404 if there is none."""
    return get_active_or_404(session, Space, space_id)


CurrentSpace = Annotated[Space, Depends(current_space)]
