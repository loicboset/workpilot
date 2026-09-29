# 0030. Todo priority: !1, !2, !3

- Status: Accepted
- Date: 2026-09-30

## Context

A day or an icebox holds todos of unequal weight, and nothing says which one comes first. The
capture bar (ADR 0010) needs a quick way to say it while typing.

## Decision

- A todo has an optional **priority from 1 to 3**, 1 being the most important. No priority is
  `null`: there is no default level. Column `todos.priority` (smallint, checked 1–3).
- **In the capture bar, `!1`, `!2` or `!3` anywhere in a `/todo` or an `/icebox`** sets it, as
  a whole word, and leaves the title. It is an argument, like a day, not a command. In `/block`,
  `/idea` and `/note`, `!1` is just text.
- Typing `!` after a space opens a menu of the three priorities, like `/` for commands. A typed
  digit closes it, so `!1` then Enter saves.
- The preview shows the priority as a button; pressing it cycles none → 1 → 2 → 3 → none. On a
  phone, `!` hides behind the symbols.
- Rows show a badge ("P1" and three bars, filled by importance) and their menu has
  "Priority ›". Within a day, and in the icebox, todos sort by priority, then as before; none
  comes last.
- Sigils kept for later: `#` for a milestone, `@` for labels.

## Why

- Todoist (`p1`–`p4`), TickTick (`!` opens a picker), Linear (priority levels) and todo.txt
  (`(A)`) inspired it. `p1` was rejected: it would eat real words ("the p1 incident"); `!` and
  a digit hardly appear in titles.
- `/p1` or `/todo1` commands were rejected: they mix what a thing is with its details, and
  lengthen the command menu.
- No default level (Todoist's p4): when every todo has a priority, it stops meaning anything.
- Bars, as in Linear, not a flag: ⚑ already means a milestone.
- Flags or labels are left for later: a single flag overlaps with priority 1.
