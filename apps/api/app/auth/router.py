"""Login routes (ADR 0002, 0003). The session lives in a signed cookie."""

from fastapi import APIRouter, HTTPException, Request, status

from app.auth.schemas import CurrentUser, LoginRequest
from app.auth.security import (
    SESSION_USER_KEY,
    CurrentUsername,
    credentials_match,
    login_throttle,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", status_code=status.HTTP_204_NO_CONTENT)
def login(credentials: LoginRequest, request: Request) -> None:
    client = request.client.host if request.client else "unknown"
    if login_throttle.is_blocked(client):
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS, "too many failed attempts, try again later"
        )
    if not credentials_match(credentials.username, credentials.password):
        login_throttle.record_failure(client)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "wrong username or password")

    login_throttle.forget(client)
    request.session.clear()  # start a fresh session
    request.session[SESSION_USER_KEY] = credentials.username


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request) -> None:
    request.session.clear()


@router.get("/me", response_model=CurrentUser)
def current_user(username: CurrentUsername) -> CurrentUser:
    return CurrentUser(username=username)
