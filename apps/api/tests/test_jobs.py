"""The job runner: when jobs run, and that one failure doesn't stop them."""

import asyncio
from datetime import timedelta

import pytest
from sqlalchemy.orm import Session

from app.config import Settings
from app.jobs import scheduled_jobs
from app.jobs.runner import Job, running_jobs, seconds_until_next_run


@pytest.mark.parametrize(
    ("every", "now", "expected"),
    [
        (timedelta(minutes=1), 120.0, 60.0),  # on the minute: wait a full minute
        (timedelta(minutes=1), 125.5, 54.5),  # 5.5 s past: wait until the next minute
        (timedelta(minutes=15), 16 * 60.0, 14 * 60.0),  # at :16, the next run is at :30
    ],
)
def test_runs_line_up_with_the_clock(every: timedelta, now: float, expected: float) -> None:
    assert seconds_until_next_run(every, now) == expected


def test_jobs_run_at_start_then_again_even_after_a_failure() -> None:
    runs: list[str] = []

    def flaky(_session: Session) -> None:
        runs.append("flaky")
        raise RuntimeError("the network is down")

    def steady(_session: Session) -> None:
        runs.append("steady")

    jobs = [
        Job("flaky", every=timedelta(milliseconds=20), run=flaky),
        Job("steady", every=timedelta(milliseconds=20), run=steady),
    ]

    async def let_them_run() -> None:
        async with running_jobs(jobs):
            await asyncio.sleep(0.2)

    asyncio.run(let_them_run())

    assert runs.count("flaky") >= 2
    assert runs.count("steady") >= 2


def test_reminders_run_only_with_a_push_contact(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("app.jobs.settings.push_contact", None)
    assert scheduled_jobs() == []

    monkeypatch.setattr("app.jobs.settings.push_contact", "mailto:me@example.org")
    assert [job.name for job in scheduled_jobs()] == ["send reminders"]


def test_push_contact_must_be_mailto_or_https() -> None:
    with pytest.raises(ValueError, match="mailto"):
        Settings(push_contact="me@example.org")


def test_an_empty_push_contact_turns_reminders_off() -> None:
    assert Settings(push_contact="").push_contact is None
