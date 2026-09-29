"""Import todos, ideas and notes from a JSON file, e.g. one written from Notion pages.

    make import FILE=imports/notion.json            # adds what the file has and the app hasn't
    make import FILE=imports/notion.json UNDO=1     # removes what the file added
    make import FILE=imports/notion.json SPACE=work # into the space at /work (default: the first)

The file:

    {
      "todos": [
        {"title": "Remove sqlite", "day": "2026-09-22", "done": true},
        {"title": "Redo the login", "notes": "- [ ] email-less users"},
        {"title": "Containerise the app", "done": "2026-09-24"}
      ],
      "ideas": [{"text": "Automate the weekly report", "day": "2026-09-01"}],
      "notes": [{"title": "Product meeting", "content": "...", "day": "2026-09-28"}]
    }

- `day`: the day it was written for. A todo is due that day, written that morning and, with
  `"done": true`, done that evening. A todo without a day goes in the icebox (ADR 0029).
- `done`: `true` (done on its day) or the day it was done.
- `milestone` (todos, optional): the title of one of the space's milestones, to link it.

Rows get ids made from what they are, so importing again adds only what is missing: rows
already in are left as they are, with the changes you made in the app, in whichever space
they are. UNDO=1 soft-deletes
(so it syncs) every row of the file; importing again after that brings them back as written.
"""

import argparse
import json
import sys
import uuid
from collections import Counter
from datetime import UTC, date, datetime, time, timedelta
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.common import select_in_space
from app.db.base import InSpaceMixin
from app.db.models import Idea, Milestone, Note, Profile, Todo
from app.db.session import SessionLocal
from scripts.spaces import find_space

NAMESPACE = uuid.UUID("3f6c2a55-8a41-4f0e-9b7d-1c5e0d2f7a93")

WRITTEN_AT = time(9, 0)
DONE_AT = time(18, 0)


class CannotImport(Exception):
    """The file can't be imported as it is; the message says why."""


def row_ids(items: list[dict[str, Any]], kind: str, text_field: str) -> list[uuid.UUID]:
    """A fixed id per row, from its kind, day and text (the same row twice gets 2 ids)."""
    seen: Counter[str] = Counter()
    ids = []
    for item in items:
        key = f"{kind}:{item.get('day')}:{item[text_field]}"
        seen[key] += 1
        ids.append(uuid.uuid5(NAMESPACE, f"{key}:{seen[key]}"))
    return ids


def read_file(path: Path) -> dict[str, list[dict[str, Any]]]:
    data = json.loads(path.read_text())
    for kind, text_field in (("todos", "title"), ("ideas", "text"), ("notes", "content")):
        for item in data.setdefault(kind, []):
            if not str(item.get(text_field, "")).strip():
                raise CannotImport(f"A row of {kind} has no {text_field}: {item}")
    return data


def import_file(
    session: Session, data: dict[str, list[dict[str, Any]]], space_slug: str | None = None
) -> None:
    profile = session.scalars(
        select(Profile).where(Profile.deleted_at.is_(None)).order_by(Profile.created_at)
    ).first()
    if profile is None:
        raise CannotImport("No profile yet: sign in and finish onboarding first.")
    space = find_space(session, space_slug)
    if space is None:
        raise CannotImport(f"No space at /{space_slug}." if space_slug else "No space yet.")
    zone = ZoneInfo(profile.timezone)
    now = datetime.now(UTC)
    milestones = {
        milestone.title: milestone.id
        for milestone in session.scalars(select_in_space(Milestone, space.id))
    }

    def moment(day: str, at: time) -> datetime:
        return datetime.combine(date.fromisoformat(day), at, zone).astimezone(UTC)

    def written(item: dict[str, Any], position: int) -> datetime:
        # Without a day, the file's order is kept by lists that show the newest first.
        return (
            moment(item["day"], WRITTEN_AT)
            if item.get("day")
            else now - timedelta(seconds=position)
        )

    def todo_fields(item: dict[str, Any], position: int) -> dict[str, Any]:
        done = item.get("done", False)
        if done is True and not item.get("day"):
            raise CannotImport(f'"{item["title"]}" is done but has no day: give "done" a day.')
        milestone = item.get("milestone")
        if milestone and milestone not in milestones:
            raise CannotImport(f'No milestone is called "{milestone}".')
        return {
            "title": item["title"].strip(),
            "notes": item.get("notes") or None,
            "due_date": date.fromisoformat(item["day"]) if item.get("day") else None,
            "completed_at": moment(item["day"] if done is True else done, DONE_AT)
            if done
            else None,
            "milestone_id": milestones.get(milestone) if milestone else None,
            "created_at": written(item, position),
        }

    def idea_fields(item: dict[str, Any], position: int) -> dict[str, Any]:
        return {"text": item["text"].strip(), "created_at": written(item, position)}

    def note_fields(item: dict[str, Any], position: int) -> dict[str, Any]:
        return {
            "title": (item.get("title") or "").strip() or None,
            "content": item["content"].strip(),
            "created_at": written(item, position),
        }

    counts: Counter[str] = Counter()
    for kind, model, text_field, fields_of in (
        ("todos", Todo, "title", todo_fields),
        ("ideas", Idea, "text", idea_fields),
        ("notes", Note, "content", note_fields),
    ):
        items = data[kind]
        for position, (row_id, item) in enumerate(
            zip(row_ids(items, kind, text_field), items, strict=True)
        ):
            fields = fields_of(item, position)
            row: InSpaceMixin | None = session.get(model, row_id)
            if row is not None and (row.deleted_at is None or row.space_id != space.id):
                counts["already in"] += 1
                continue
            if row is None:
                session.add(model(id=row_id, space_id=space.id, updated_at=now, **fields))
            else:  # removed by UNDO=1: back as written
                for name, value in fields.items():
                    setattr(row, name, value)
                row.deleted_at = None
            counts[f"{kind} added"] += 1
            if kind == "todos" and fields["due_date"] is None:
                counts["in the icebox"] += 1

    session.commit()
    print(
        f'Into "{space.name}": added {counts["todos added"]} todos '
        f"({counts['in the icebox']} in the icebox), "
        f"{counts['ideas added']} ideas and {counts['notes added']} notes; "
        f"{counts['already in']} were already in. The app syncs them soon."
    )


def undo(session: Session, data: dict[str, list[dict[str, Any]]]) -> None:
    """Soft-delete every row of the file that is still there."""
    now = datetime.now(UTC)
    removed = 0
    for kind, model, text_field in (
        ("todos", Todo, "title"),
        ("ideas", Idea, "text"),
        ("notes", Note, "content"),
    ):
        ids = row_ids(data[kind], kind, text_field)
        for row in session.scalars(
            select(model).where(model.id.in_(ids), model.deleted_at.is_(None))
        ):
            row.deleted_at = now
            removed += 1
    session.commit()
    print(f"Removed {removed} imported rows.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Import todos, ideas and notes from JSON.")
    parser.add_argument("file", type=Path, help="the JSON file")
    parser.add_argument("--undo", action="store_true", help="remove what the file added")
    parser.add_argument("--space", help="the space's URL name (default: the first space)")
    args = parser.parse_args()
    try:
        data = read_file(args.file)
        with SessionLocal() as session:
            if args.undo:
                undo(session, data)
            else:
                import_file(session, data, args.space)
    except CannotImport as error:
        sys.exit(str(error))


if __name__ == "__main__":
    main()
