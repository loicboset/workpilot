"""REST routes for todos (ADR 0017). Every other resource follows the same pattern."""

import uuid
from datetime import date

from fastapi import APIRouter, status

from app.common import create_row, get_active_or_404, select_rows, soft_delete, update_row
from app.db.models import Todo
from app.db.session import SessionDep
from app.domain.todos.schemas import TodoCreate, TodoRead, TodoUpdate

router = APIRouter(prefix="/api/todos", tags=["todos"])


@router.get("", response_model=list[TodoRead])
def list_todos(
    session: SessionDep,
    due_from: date | None = None,
    due_to: date | None = None,
    completed: bool | None = None,
    milestone_id: uuid.UUID | None = None,
    include_deleted: bool = False,
) -> list[Todo]:
    stmt = select_rows(Todo, include_deleted)
    if due_from is not None:
        stmt = stmt.where(Todo.due_date >= due_from)
    if due_to is not None:
        stmt = stmt.where(Todo.due_date <= due_to)
    if completed is True:
        stmt = stmt.where(Todo.completed_at.is_not(None))
    elif completed is False:
        stmt = stmt.where(Todo.completed_at.is_(None))
    if milestone_id is not None:
        stmt = stmt.where(Todo.milestone_id == milestone_id)
    # Dated todos first (soonest first), then undated, oldest first.
    stmt = stmt.order_by(Todo.due_date.is_(None), Todo.due_date, Todo.created_at)
    return list(session.scalars(stmt))


@router.post("", response_model=TodoRead, status_code=status.HTTP_201_CREATED)
def create_todo(data: TodoCreate, session: SessionDep) -> Todo:
    return create_row(session, Todo, data)


@router.get("/{todo_id}", response_model=TodoRead)
def get_todo(todo_id: uuid.UUID, session: SessionDep) -> Todo:
    return get_active_or_404(session, Todo, todo_id)


@router.patch("/{todo_id}", response_model=TodoRead)
def update_todo(todo_id: uuid.UUID, data: TodoUpdate, session: SessionDep) -> Todo:
    todo = get_active_or_404(session, Todo, todo_id)
    return update_row(session, todo, data.changes())


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(todo_id: uuid.UUID, session: SessionDep) -> None:
    soft_delete(session, get_active_or_404(session, Todo, todo_id))
