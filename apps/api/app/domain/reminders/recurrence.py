"""Repeating reminders: iCal recurrence rules (RRULE), e.g. "FREQ=WEEKLY;BYDAY=FR"."""

import re
from datetime import UTC, datetime
from zoneinfo import ZoneInfo

from dateutil.rrule import rrulestr

# Only the rule itself, "NAME=value;NAME=value": no "RRULE:" prefix, no DTSTART line.
RULE_SHAPE = re.compile(r"[A-Z]+=[^;\s]+(;[A-Z]+=[^;\s]+)*")
# Any start works for checking a rule. It must have a timezone, like real reminders do.
SAMPLE_START = datetime(2026, 1, 1, tzinfo=UTC)


def check_rule(rule: str) -> str:
    """Accept a rule the reminder job can follow."""
    if not RULE_SHAPE.fullmatch(rule):
        raise ValueError("invalid recurrence rule")
    try:
        rrulestr(rule, dtstart=SAMPLE_START)
    except (ValueError, TypeError) as error:
        raise ValueError("invalid recurrence rule") from error
    if "COUNT=" in rule.upper():
        # Each occurrence moves `remind_at` forward, so a count would restart every time.
        raise ValueError("COUNT is not supported; use UNTIL")
    return rule


def next_occurrence(
    rule: str, previous: datetime, after: datetime, timezone: str
) -> datetime | None:
    """When the rule fires next, after `after`, in UTC. None once the rule has ended.

    Counted in the user's timezone, so "every day at 9:00" stays at 9:00 when clocks change.
    """
    zone = ZoneInfo(timezone)
    upcoming = rrulestr(rule, dtstart=previous.astimezone(zone)).after(after.astimezone(zone))
    return upcoming.astimezone(UTC) if upcoming else None
