"""REST routes for ideas captured with /idea (the ideas inbox)."""

import uuid

from fastapi import APIRouter, status

from app.common import create_row, get_in_space_or_404, select_in_space, soft_delete, update_row
from app.db.models import Idea
from app.db.session import SessionDep
from app.domain.ideas.schemas import IdeaCreate, IdeaRead, IdeaUpdate
from app.domain.spaces.current import CurrentSpace

router = APIRouter(prefix="/ideas", tags=["ideas"])


@router.get("", response_model=list[IdeaRead])
def list_ideas(
    session: SessionDep, space: CurrentSpace, include_deleted: bool = False
) -> list[Idea]:
    stmt = select_in_space(Idea, space.id, include_deleted).order_by(
        Idea.created_at.desc()
    )  # newest first
    return list(session.scalars(stmt))


@router.post("", response_model=IdeaRead, status_code=status.HTTP_201_CREATED)
def create_idea(data: IdeaCreate, session: SessionDep, space: CurrentSpace) -> Idea:
    return create_row(session, Idea, data, space_id=space.id)


@router.get("/{idea_id}", response_model=IdeaRead)
def get_idea(idea_id: uuid.UUID, session: SessionDep, space: CurrentSpace) -> Idea:
    return get_in_space_or_404(session, Idea, space.id, idea_id)


@router.patch("/{idea_id}", response_model=IdeaRead)
def update_idea(
    idea_id: uuid.UUID, data: IdeaUpdate, session: SessionDep, space: CurrentSpace
) -> Idea:
    idea = get_in_space_or_404(session, Idea, space.id, idea_id)
    return update_row(session, idea, data.changes())


@router.delete("/{idea_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_idea(idea_id: uuid.UUID, session: SessionDep, space: CurrentSpace) -> None:
    soft_delete(session, get_in_space_or_404(session, Idea, space.id, idea_id))
