"""REST routes for ideas captured with /idea (the ideas inbox)."""

import uuid

from fastapi import APIRouter, status

from app.common import create_row, get_active_or_404, select_rows, soft_delete, update_row
from app.db.models import Idea
from app.db.session import SessionDep
from app.domain.ideas.schemas import IdeaCreate, IdeaRead, IdeaUpdate

router = APIRouter(prefix="/api/ideas", tags=["ideas"])


@router.get("", response_model=list[IdeaRead])
def list_ideas(session: SessionDep, include_deleted: bool = False) -> list[Idea]:
    stmt = select_rows(Idea, include_deleted).order_by(Idea.created_at.desc())  # newest first
    return list(session.scalars(stmt))


@router.post("", response_model=IdeaRead, status_code=status.HTTP_201_CREATED)
def create_idea(data: IdeaCreate, session: SessionDep) -> Idea:
    return create_row(session, Idea, data)


@router.get("/{idea_id}", response_model=IdeaRead)
def get_idea(idea_id: uuid.UUID, session: SessionDep) -> Idea:
    return get_active_or_404(session, Idea, idea_id)


@router.patch("/{idea_id}", response_model=IdeaRead)
def update_idea(idea_id: uuid.UUID, data: IdeaUpdate, session: SessionDep) -> Idea:
    idea = get_active_or_404(session, Idea, idea_id)
    return update_row(session, idea, data.changes())


@router.delete("/{idea_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_idea(idea_id: uuid.UUID, session: SessionDep) -> None:
    soft_delete(session, get_active_or_404(session, Idea, idea_id))
