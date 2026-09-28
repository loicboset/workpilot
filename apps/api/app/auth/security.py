"""Single-user login: credential check, login throttling and the require_login dependency."""

import secrets
import time
from collections import defaultdict, deque
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status

from app.config import settings

SESSION_COOKIE = "workpilot_session"
SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60  # stay signed in for 30 days
SESSION_USER_KEY = "username"


def credentials_match(username: str, password: str) -> bool:
    """Compare with the configured login in constant time, so timing leaks nothing."""
    expected_username, expected_password = settings.login
    username_ok = secrets.compare_digest(username.encode(), expected_username.encode())
    password_ok = secrets.compare_digest(password.encode(), expected_password.encode())
    return username_ok and password_ok


class LoginThrottle:
    """Blocks a client after too many failed logins within a time window.

    Kept in memory: enough for a single-user app running as one process.
    """

    def __init__(self, max_failures: int = 5, window_seconds: float = 15 * 60) -> None:
        self.max_failures = max_failures
        self.window_seconds = window_seconds
        self._failures: dict[str, deque[float]] = defaultdict(deque)

    def is_blocked(self, client: str) -> bool:
        return len(self._recent_failures(client)) >= self.max_failures

    def record_failure(self, client: str) -> None:
        self._failures[client].append(time.monotonic())

    def forget(self, client: str) -> None:
        """Clear a client's failures (after a successful login)."""
        self._failures.pop(client, None)

    def forget_all(self) -> None:
        self._failures.clear()

    def _recent_failures(self, client: str) -> deque[float]:
        failures = self._failures[client]
        oldest_allowed = time.monotonic() - self.window_seconds
        while failures and failures[0] < oldest_allowed:
            failures.popleft()
        return failures


login_throttle = LoginThrottle()


def require_login(request: Request) -> str:
    """FastAPI dependency: the signed-in username, or 401."""
    username = request.session.get(SESSION_USER_KEY)
    if username is None or username != settings.login[0]:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "not signed in")
    return username


CurrentUsername = Annotated[str, Depends(require_login)]
