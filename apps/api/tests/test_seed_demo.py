"""The demo seed (scripts/seed_demo.py, `make seed`): the Grove concept's data, yours kept aside."""

import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Milestone, NorthStar, Profile, TimeBlock, Todo
from scripts.seed_demo import LAST_WEEK, NORTH_STAR, THIS_WEEK, seed, undo


def add_profile(db: Session) -> None:
    db.add(Profile(first_name="Ada", timezone="Europe/Zurich"))
    db.commit()


def active[Row](db: Session, model: type[Row]) -> list[Row]:
    return list(db.scalars(select(model).where(model.deleted_at.is_(None))))


def add_my_north_star(db: Session) -> None:
    mine = NorthStar(title="Finish my first novel")
    db.add(mine)
    db.flush()
    db.add(Milestone(north_star_id=mine.id, title="First draft done", position=0))
    db.commit()


def test_seed_needs_a_profile(db: Session) -> None:
    with pytest.raises(SystemExit):
        seed(db, replace=False)


def test_seed_fills_an_empty_workspace(db: Session) -> None:
    add_profile(db)
    seed(db, replace=False)

    assert [star.title for star in active(db, NorthStar)] == [NORTH_STAR]
    milestones = sorted(active(db, Milestone), key=lambda milestone: milestone.position)
    assert [milestone.title for milestone in milestones] == [
        "Foundations",
        "Team rhythm",
        "AI platform live",
        "Autonomous teams",
        "The calm org",
    ]
    assert [milestone.completed_at is not None for milestone in milestones] == [
        True,
        True,
        False,
        False,
        False,
    ]
    blocks = sorted(active(db, TimeBlock), key=lambda block: block.start_at)
    assert [block.title for block in blocks][:2] == [
        "Plan the day",
        "Deep work · Data platform RFC",
    ]
    # Done work for "time aligned": 8 of 13 linked this week (with "Plan the day"), 6 of 11
    # last week.
    todos = active(db, Todo)
    assert len(todos) == len(THIS_WEEK) + len(LAST_WEEK) == 23
    assert all(todo.completed_at is not None for todo in todos)
    assert sum(todo.milestone_id is not None for todo in todos) == 8 + 6


def test_seeding_again_updates_the_same_rows(db: Session) -> None:
    add_profile(db)
    seed(db, replace=False)
    seed(db, replace=False)

    assert len(active(db, NorthStar)) == 1
    assert len(active(db, Milestone)) == 5
    assert len(active(db, TimeBlock)) == 5
    assert len(active(db, Todo)) == 23


def test_seed_leaves_your_north_star_alone_unless_asked(db: Session) -> None:
    add_profile(db)
    add_my_north_star(db)

    with pytest.raises(SystemExit):
        seed(db, replace=False)

    db.rollback()
    assert [star.title for star in active(db, NorthStar)] == ["Finish my first novel"]
    assert [milestone.title for milestone in active(db, Milestone)] == ["First draft done"]


def test_replace_puts_yours_aside_and_undo_brings_it_back(db: Session) -> None:
    add_profile(db)
    add_my_north_star(db)

    seed(db, replace=True)
    assert [star.title for star in active(db, NorthStar)] == [NORTH_STAR]
    assert "First draft done" not in [milestone.title for milestone in active(db, Milestone)]
    mine = db.scalars(select(NorthStar).where(NorthStar.title == "Finish my first novel")).one()
    assert mine.deleted_at is not None  # put aside, not changed

    undo(db)
    assert [star.title for star in active(db, NorthStar)] == ["Finish my first novel"]
    assert [milestone.title for milestone in active(db, Milestone)] == ["First draft done"]
    assert active(db, TimeBlock) == []
    assert active(db, Todo) == []
