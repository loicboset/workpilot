# 0027. Background jobs

- Status: Accepted
- Date: 2026-09-28

## Context

Some work must happen at a set time, even when no one has the app open: sending reminders
(v0.2) and, later, checking connectors such as RSS or GitHub (v0.5). WorkPilot is one
container with one API process (ADR 0020) and a single user.

## Decision

- **Jobs run inside the API process**, started and stopped with the app (FastAPI lifespan).
  No worker container, no queue, no scheduler library. `app/jobs/` lists the jobs; each runs
  at start (to catch up), then on its schedule, lined up with the clock (every minute on the
  minute, every 15 minutes at :00, :15…). A failing run is logged and the job carries on.
- **The database holds the state**, so nothing is lost when the app stops. For reminders: a
  reminder is due when `remind_at <= now` and it hasn't been sent for that time
  (`sent_at` empty or older than `remind_at`). Moving a reminder later sends it again,
  whether the change came through REST or sync.
- `SELECT … FOR UPDATE SKIP LOCKED` picks the due reminders, so a second server running by
  mistake can't send one twice.
- **Reminders**: the job sends a Web Push message to every device (`pywebpush`). A device
  that is gone (404/410) is removed. If no device could be reached (network, 429, 5xx), the
  reminder is tried again next minute; otherwise it is marked sent, so no duplicates.
  Repeating reminders (iCal RRULE, no `COUNT`) move `remind_at` to the next time, counted in
  the user's timezone so "9:00" stays 9:00 when clocks change.
- **VAPID key**: derived from `WORKPILOT_SECRET_KEY` (HKDF), so there is no key file to manage.
  `WORKPILOT_PUSH_CONTACT` (a `mailto:` or `https:` contact, required by push services;
  Apple refuses made-up ones) turns reminders on.

## Why

- Vikunja sends reminders the same way: an in-process check every minute.
- APScheduler 4 is still not stable; APScheduler 3, Procrastinate or Celery would add a
  library (and for Celery, Redis) for what is a loop and a query.
- `pywebpush` is the reference Python implementation from the web-push-libs project
  (2.5.0, Aug 2026). It brings `requests` and `aiohttp`: accepted, rather than
  re-implementing message encryption.

## Consequences

- Running several API processes is safe for reminders, but each one runs the jobs.
- Changing `WORKPILOT_SECRET_KEY` changes the VAPID key: devices must turn notifications on
  again.
- Connectors will add a job here, with their own "next check" state in the database.
