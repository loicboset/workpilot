"""REST routes for the North Star: the one long-term goal (ADR 0013)."""

from fastapi import APIRouter

from app.common import get_singleton_or_404, put_singleton
from app.db.models import NorthStar
from app.db.session import SessionDep
from app.domain.north_star.schemas import NorthStarRead, NorthStarWrite

router = APIRouter(prefix="/api/north-star", tags=["north star"])


@router.get("", response_model=NorthStarRead)
def get_north_star(session: SessionDep) -> NorthStar:
    return get_singleton_or_404(session, NorthStar)


@router.put("", response_model=NorthStarRead)
def put_north_star(data: NorthStarWrite, session: SessionDep) -> NorthStar:
    return put_singleton(session, NorthStar, data)
