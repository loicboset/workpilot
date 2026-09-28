"""Background jobs: work that must happen at a set time, even when no one has the app open.

Reminders today; connectors (checking RSS, GitHub…) will be added here (ADR 0027).
"""

import logging
from datetime import timedelta

from app.config import settings
from app.domain.reminders.delivery import send_due_reminders
from app.jobs.runner import Job

logger = logging.getLogger(__name__)


def scheduled_jobs() -> list[Job]:
    jobs: list[Job] = []
    if settings.push_contact:
        jobs.append(Job("send reminders", every=timedelta(minutes=1), run=send_due_reminders))
    else:
        logger.warning("Reminders are off: set WORKPILOT_PUSH_CONTACT to send them")
    return jobs
