"""Fill the workspace with the Grove concept's demo data (development only).

    make seed             # stops if you already have a North Star of your own
    make seed REPLACE=1   # puts your North Star and its milestones aside, adds the demo ones
    make seed UNDO=1      # removes the demo data and brings yours back

Rows get fixed ids, so running it again updates them instead of adding more: the time blocks
move to today, the done work to this week and last week. Nothing of yours is changed: what is
put aside is soft-deleted (marked deleted, so it syncs) and comes back with UNDO=1.
"""

import argparse
import sys
import uuid
from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.base import SyncedMixin
from app.db.models import Milestone, NorthStar, Profile, TimeBlock, Todo
from app.db.session import SessionLocal

NAMESPACE = uuid.UUID("7b0c1f0e-5d0a-4c55-9a3e-6f1d2b8c9e41")

NORTH_STAR = (
    "Build a calm, AI-augmented tech organisation that ships with confidence — "
    "and lets people do their best work."
)

# (key, title, description, target date, done on), dates relative to this year.
MILESTONES = [
    (
        "foundations",
        "Foundations",
        "Tools, rituals and a team that trusts them.",
        (0, 3, 31),
        (0, 3, 27),
    ),
    (
        "team-rhythm",
        "Team rhythm",
        "Planning, demos and retros that people look forward to.",
        (0, 6, 30),
        (0, 6, 19),
    ),
    (
        "ai-platform",
        "AI platform live",
        "One real use case in production, loved by one team.",
        (0, 12, 15),
        None,
    ),
    ("autonomous-teams", "Autonomous teams", "Teams decide, the managers coach.", (1, 9, 30), None),
    ("calm-org", "The calm org", "Confident releases, sustainable pace.", (2, 6, 30), None),
]

# (key, title, start, end, milestone key, done at)
TIME_BLOCKS = [
    ("plan", "Plan the day", (8, 30), (9, 0), None, (8, 55)),
    ("deep-work", "Deep work · Data platform RFC", (9, 0), (11, 0), "ai-platform", None),
    ("one-on-one", "1:1 with [Team lead]", (11, 30), (12, 0), None, None),
    ("lunch-walk", "Lunch walk, no phone", (12, 30), (13, 30), "calm-org", None),
    ("vendor-call", "Vendor call · AI tooling", (14, 0), (15, 0), None, None),
]

# Done todos, so "time aligned" reads 62% this week (8 of 13 with "Plan the day") and 55% last
# week (6 of 11). (title, milestone key)
THIS_WEEK = [
    ("Review the data platform RFC draft", "ai-platform"),
    ("Pair on the ingestion pipeline", "ai-platform"),
    ("Write the evaluation checklist", "ai-platform"),
    ("Demo the prototype to the pilot team", "ai-platform"),
    ("Answer the security questionnaire", "ai-platform"),
    ("Draft the rollout plan", "ai-platform"),
    ("Hand over the sprint planning", "autonomous-teams"),
    ("Write the decision-making guide", "autonomous-teams"),
    ("Expense report", None),
    ("Book the team offsite", None),
    ("Clear the inbox", None),
    ("Update the hiring scorecard", None),
]
LAST_WEEK = [
    ("Compare two vector databases", "ai-platform"),
    ("Sketch the platform architecture", "ai-platform"),
    ("Interview the pilot team", "ai-platform"),
    ("Set up the evaluation dataset", "ai-platform"),
    ("Run the first team retro", "autonomous-teams"),
    ("Agree on team working hours", "calm-org"),
    ("Budget review", None),
    ("Quarterly report", None),
    ("Renew the software licences", None),
    ("Onboarding paperwork", None),
    ("Plan the conference trip", None),
]


def demo_id(key: str) -> uuid.UUID:
    return uuid.uuid5(NAMESPACE, key)


DEMO_IDS = {
    demo_id(key)
    for key in [
        "north-star",
        *(key for key, *_ in MILESTONES),
        *(f"block-{key}" for key, *_ in TIME_BLOCKS),
        *(f"todo-this-{index}" for index in range(len(THIS_WEEK))),
        *(f"todo-last-{index}" for index in range(len(LAST_WEEK))),
    ]
}


def upsert[Row: SyncedMixin](session: Session, model: type[Row], key: str, **fields) -> Row:
    """The demo row with this key, created or updated (and undeleted)."""
    row = session.get(model, demo_id(key))
    if row is None:
        row = model(id=demo_id(key), **fields)
        session.add(row)
    else:
        for name, value in fields.items():
            setattr(row, name, value)
        row.deleted_at = None
    return row


def seed(session: Session, replace: bool) -> None:
    profile = session.scalars(
        select(Profile).where(Profile.deleted_at.is_(None)).order_by(Profile.created_at)
    ).first()
    if profile is None:
        sys.exit("No profile yet: sign in and finish onboarding first.")
    zone = ZoneInfo(profile.timezone)
    today = datetime.now(zone).date()
    now = datetime.now(UTC)

    def moment(day: date, hour: int, minute: int) -> datetime:
        return datetime.combine(day, time(hour, minute), zone).astimezone(UTC)

    # Your North Star and its milestones are put aside (all at the same moment, for --undo).
    for north_star in session.scalars(select(NorthStar).where(NorthStar.deleted_at.is_(None))):
        if north_star.id == demo_id("north-star"):
            continue
        if not replace:
            sys.exit(
                f'Your North Star is "{north_star.title}". Run `make seed REPLACE=1` to put it '
                "aside (with its milestones) while the demo data is in; `make seed UNDO=1` brings "
                "it back."
            )
        north_star.deleted_at = now
        print(f'Put aside the North Star "{north_star.title}".')
    for milestone in session.scalars(select(Milestone).where(Milestone.deleted_at.is_(None))):
        if milestone.id not in DEMO_IDS:
            milestone.deleted_at = now
            print(f'Put aside the milestone "{milestone.title}".')

    north_star = upsert(
        session,
        NorthStar,
        "north-star",
        title=NORTH_STAR,
        description="So people can do the best work of their careers, without burning out.",
        target_date=date(today.year + 2, 12, 31),
    )
    session.flush()  # the models have no relationships: insert the North Star before its milestones
    milestone_ids = {}
    for position, (key, title, description, target, done) in enumerate(MILESTONES):
        milestone = upsert(
            session,
            Milestone,
            key,
            north_star_id=north_star.id,
            title=title,
            description=description,
            target_date=date(today.year + target[0], target[1], target[2]),
            position=position,
            completed_at=moment(date(today.year + done[0], done[1], done[2]), 17, 0)
            if done
            else None,
        )
        milestone_ids[key] = milestone.id

    for key, title, start, end, milestone_key, done in TIME_BLOCKS:
        upsert(
            session,
            TimeBlock,
            f"block-{key}",
            title=title,
            start_at=moment(today, *start),
            end_at=moment(today, *end),
            milestone_id=milestone_ids.get(milestone_key),
            completed_at=moment(today, *done) if done else None,
        )

    # This week's done work goes on yesterday, when it is in this week whether weeks start on
    # Sunday or Monday; on Sunday and Monday it goes on today, without a due day (not to crowd
    # the Today card). Last week's goes 7 days earlier.
    weekday = today.isoweekday()  # Monday 1 … Sunday 7
    this_week = today - timedelta(days=1) if 2 <= weekday <= 6 else today
    for week, day, todos in (
        ("this", this_week, THIS_WEEK),
        ("last", this_week - timedelta(days=7), LAST_WEEK),
    ):
        for index, (title, milestone_key) in enumerate(todos):
            upsert(
                session,
                Todo,
                f"todo-{week}-{index}",
                title=title,
                notes=None,
                due_date=None if day == today else day,
                completed_at=moment(day, 9, 0) + timedelta(minutes=25 * index),
                milestone_id=milestone_ids.get(milestone_key),
            )

    session.commit()
    print(f"Demo data ready for {today.isoformat()} ({profile.timezone}). The app syncs it soon.")


def undo(session: Session) -> None:
    """Soft-delete the demo rows and bring back the North Star and milestones put aside."""
    now = datetime.now(UTC)
    for model in (NorthStar, Milestone, TimeBlock, Todo):
        for row in session.scalars(
            select(model).where(model.id.in_(DEMO_IDS), model.deleted_at.is_(None))
        ):
            row.deleted_at = now
    put_aside = session.scalars(
        select(NorthStar)
        .where(NorthStar.id.not_in(DEMO_IDS), NorthStar.deleted_at.is_not(None))
        .order_by(NorthStar.deleted_at.desc())
    ).first()
    if put_aside is not None:
        moment = put_aside.deleted_at
        for model in (NorthStar, Milestone):
            for row in session.scalars(select(model).where(model.deleted_at == moment)):
                row.deleted_at = None
        print(f'Brought back the North Star "{put_aside.title}" and its milestones.')
    session.commit()
    print("Demo data removed.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Fill the workspace with demo data.")
    parser.add_argument("--replace", action="store_true", help="put your North Star aside")
    parser.add_argument("--undo", action="store_true", help="remove the demo data")
    args = parser.parse_args()
    with SessionLocal() as session:
        if args.undo:
            undo(session)
        else:
            seed(session, replace=args.replace)


if __name__ == "__main__":
    main()
