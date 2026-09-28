"""Runs jobs on a schedule inside the API process, while the app runs (ADR 0027).

The database holds what has to be done (e.g. reminders with `remind_at` and `sent_at`), so a
job only has to look at it regularly. Nothing is lost if the app stops: the next run catches up.
"""

import asyncio
import logging
import time
from collections.abc import AsyncIterator, Callable
from contextlib import asynccontextmanager
from dataclasses import dataclass
from datetime import timedelta

from sqlalchemy.orm import Session

from app.db.session import SessionLocal

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class Job:
    name: str
    every: timedelta
    run: Callable[[Session], None]


@asynccontextmanager
async def running_jobs(jobs: list[Job]) -> AsyncIterator[None]:
    """Run the jobs in the background until the block ends (the app's lifespan)."""
    tasks = [asyncio.create_task(_run_forever(job), name=job.name) for job in jobs]
    try:
        yield
    finally:
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)


async def _run_forever(job: Job) -> None:
    """Run the job now (to catch up after a restart), then on every tick of its schedule."""
    while True:
        try:
            await asyncio.to_thread(_run_once, job)
        except Exception:
            logger.exception("Job %r failed; it runs again at its next time", job.name)
        await asyncio.sleep(seconds_until_next_run(job.every, now=time.time()))


def _run_once(job: Job) -> None:
    with SessionLocal() as session:
        job.run(session)


def seconds_until_next_run(every: timedelta, now: float) -> float:
    """Runs line up with the clock: every minute on the minute, every 15 minutes at :00, :15…"""
    interval = every.total_seconds()
    return interval - now % interval
