"""The JSON import (scripts/import_data.py, `make import`): todos, ideas and notes, undoable."""

from datetime import date, datetime
from zoneinfo import ZoneInfo

import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Idea, Milestone, NorthStar, Note, Profile, Todo
from scripts.import_data import CannotImport, import_file, undo

ZURICH = ZoneInfo("Europe/Zurich")


def add_profile(db: Session) -> None:
    db.add(Profile(first_name="Ada", timezone="Europe/Zurich"))
    db.commit()


def active[Row](db: Session, model: type[Row]) -> list[Row]:
    return list(db.scalars(select(model).where(model.deleted_at.is_(None))))


def sample() -> dict:
    return {
        "todos": [
            {"title": "Remove sqlite", "day": "2026-09-22", "done": True},
            {"title": "Reply to the pyannote CTO", "day": "2026-09-28"},
            {"title": "Redo the login", "notes": "- [ ] email-less users"},
            {"title": "Containerise the app", "done": "2026-09-24"},
        ],
        "ideas": [{"text": "Try PostHog"}],
        "notes": [{"title": "Product meeting", "content": "Released: …", "day": "2026-09-28"}],
    }


def test_import_needs_a_profile(db: Session) -> None:
    with pytest.raises(CannotImport):
        import_file(db, sample())


def test_import_writes_each_row_on_its_day(db: Session) -> None:
    add_profile(db)
    import_file(db, sample())

    todos = {todo.title: todo for todo in active(db, Todo)}
    done = todos["Remove sqlite"]
    assert done.due_date == date(2026, 9, 22)
    assert done.created_at == datetime(2026, 9, 22, 9, 0, tzinfo=ZURICH)
    assert done.completed_at == datetime(2026, 9, 22, 18, 0, tzinfo=ZURICH)
    assert todos["Reply to the pyannote CTO"].completed_at is None

    # No day: in the icebox, newest first in the file's order.
    login, container = todos["Redo the login"], todos["Containerise the app"]
    assert login.due_date is None and container.due_date is None
    assert login.notes == "- [ ] email-less users"
    assert login.created_at > container.created_at
    assert container.completed_at == datetime(2026, 9, 24, 18, 0, tzinfo=ZURICH)

    assert [idea.text for idea in active(db, Idea)] == ["Try PostHog"]
    [note] = active(db, Note)
    assert (note.title, note.created_at) == (
        "Product meeting",
        datetime(2026, 9, 28, 9, 0, tzinfo=ZURICH),
    )


def test_importing_again_adds_nothing_and_keeps_your_changes(db: Session) -> None:
    add_profile(db)
    import_file(db, sample())
    reply = next(todo for todo in active(db, Todo) if todo.title.startswith("Reply"))
    reply.due_date = date(2026, 10, 1)  # postponed in the app
    db.commit()

    import_file(db, sample())

    assert len(active(db, Todo)) == 4
    assert len(active(db, Note)) == 1
    db.refresh(reply)
    assert reply.due_date == date(2026, 10, 1)


def test_the_same_todo_twice_on_a_day_is_two_rows(db: Session) -> None:
    add_profile(db)
    same = {"title": "Call Eric", "day": "2026-09-25"}
    import_file(db, {"todos": [same, same], "ideas": [], "notes": []})

    assert len(active(db, Todo)) == 2


def test_undo_removes_only_the_imported_rows_and_import_brings_them_back(db: Session) -> None:
    add_profile(db)
    db.add(Todo(title="finish vibe coding guide", due_date=date(2026, 9, 29)))
    db.commit()
    import_file(db, sample())

    undo(db, sample())

    assert [todo.title for todo in active(db, Todo)] == ["finish vibe coding guide"]
    assert active(db, Idea) == [] and active(db, Note) == []
    assert all(todo.deleted_at is not None for todo in db.scalars(select(Todo)) if todo.notes)

    import_file(db, sample())
    assert len(active(db, Todo)) == 5


def test_links_a_todo_to_a_milestone_by_its_title(db: Session) -> None:
    add_profile(db)
    north_star = NorthStar(title="Successful first POC")
    db.add(north_star)
    db.flush()
    milestone = Milestone(north_star_id=north_star.id, title="Ticketing system in place")
    db.add(milestone)
    db.commit()

    linked = {"title": "Capture bugs in-app", "milestone": "Ticketing system in place"}
    import_file(db, {"todos": [linked], "ideas": [], "notes": []})
    assert active(db, Todo)[0].milestone_id == milestone.id

    with pytest.raises(CannotImport, match="No milestone"):
        import_file(db, {"todos": [{"title": "x", "milestone": "Nope"}], "ideas": [], "notes": []})


def test_a_done_todo_needs_a_day(db: Session) -> None:
    add_profile(db)
    with pytest.raises(CannotImport, match="no day"):
        import_file(db, {"todos": [{"title": "Done", "done": True}], "ideas": [], "notes": []})
