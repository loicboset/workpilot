# 0029. Icebox: the todos without a date

- Status: Accepted
- Date: 2026-09-29

## Context

A todo without a date showed under "Someday" on Today, every day. Moving a Notion workspace in
showed the limit: dozens of shelved todos (big projects, a backlog) would crowd the day. They
need a place of their own, out of Today but one step away.

## Decision

- **The icebox is the todos without a date.** No new column: `due_date` empty = in the icebox.
- Its name stays **Icebox** in every language, as a proper name ("Mettre dans l'Icebox").
- `/todo` without a day is due **today**; `/icebox` keeps a todo without a date (its date words
  stay in the title). The Icebox page has its own field too.
- ❄️ "Move to the icebox" on any todo removes its day. Giving it a day ("Move to today",
  tomorrow, next week, pick a day) takes it out. Today no longer shows undated todos.
- An idea can move to the icebox as a todo, from the Ideas & notes page.
- Steps of a todo are kept in its `notes` as a Markdown checklist (`- [ ] step`); the row shows
  how many are ticked. No sub-todos.

## Why

- One rule ("no date = icebox") needs no migration and follows "postpone = change the date"
  (ADR 0021). A separate flag would allow a dated todo in the icebox, which means nothing.
- Defaulting `/todo` to today keeps undated todos deliberate, so the icebox holds only what was
  put there.
- Sub-todos (`todos.parent_id`) were rejected for now: a checklist in the notes covers steps
  without changing the model, the sync or the Today view.
