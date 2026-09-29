"""REST routes for milestones: the steps on the path to the North Star (ADR 0013)."""

import uuid

from fastapi import APIRouter, status

from app.common import create_row, get_in_space_or_404, select_in_space, soft_delete, update_row
from app.db.models import Milestone
from app.db.session import SessionDep
from app.domain.milestones.schemas import MilestoneCreate, MilestoneRead, MilestoneUpdate
from app.domain.spaces.current import CurrentSpace

router = APIRouter(prefix="/milestones", tags=["milestones"])


@router.get("", response_model=list[MilestoneRead])
def list_milestones(
    session: SessionDep,
    space: CurrentSpace,
    north_star_id: uuid.UUID | None = None,
    completed: bool | None = None,
    include_deleted: bool = False,
) -> list[Milestone]:
    stmt = select_in_space(Milestone, space.id, include_deleted)
    if north_star_id is not None:
        stmt = stmt.where(Milestone.north_star_id == north_star_id)
    if completed is True:
        stmt = stmt.where(Milestone.completed_at.is_not(None))
    elif completed is False:
        stmt = stmt.where(Milestone.completed_at.is_(None))
    stmt = stmt.order_by(Milestone.position, Milestone.created_at)
    return list(session.scalars(stmt))


@router.post("", response_model=MilestoneRead, status_code=status.HTTP_201_CREATED)
def create_milestone(data: MilestoneCreate, session: SessionDep, space: CurrentSpace) -> Milestone:
    return create_row(session, Milestone, data, space_id=space.id)


@router.get("/{milestone_id}", response_model=MilestoneRead)
def get_milestone(milestone_id: uuid.UUID, session: SessionDep, space: CurrentSpace) -> Milestone:
    return get_in_space_or_404(session, Milestone, space.id, milestone_id)


@router.patch("/{milestone_id}", response_model=MilestoneRead)
def update_milestone(
    milestone_id: uuid.UUID, data: MilestoneUpdate, session: SessionDep, space: CurrentSpace
) -> Milestone:
    milestone = get_in_space_or_404(session, Milestone, space.id, milestone_id)
    return update_row(session, milestone, data.changes())


@router.delete("/{milestone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_milestone(milestone_id: uuid.UUID, session: SessionDep, space: CurrentSpace) -> None:
    soft_delete(session, get_in_space_or_404(session, Milestone, space.id, milestone_id))
