"""REST routes for a space's North Star: its one long-term goal (ADR 0013, 0031)."""

from fastapi import APIRouter

from app.common import get_singleton_or_404, put_singleton
from app.db.models import NorthStar
from app.db.session import SessionDep
from app.domain.north_star.schemas import NorthStarRead, NorthStarWrite
from app.domain.spaces.current import CurrentSpace

router = APIRouter(prefix="/north-star", tags=["north star"])


@router.get("", response_model=NorthStarRead)
def get_north_star(session: SessionDep, space: CurrentSpace) -> NorthStar:
    return get_singleton_or_404(session, NorthStar, space.id)


@router.put("", response_model=NorthStarRead)
def put_north_star(data: NorthStarWrite, session: SessionDep, space: CurrentSpace) -> NorthStar:
    return put_singleton(session, NorthStar, data, space.id)
