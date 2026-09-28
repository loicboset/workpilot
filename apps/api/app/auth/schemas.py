"""Request and response shapes for login."""

from typing import Annotated

from pydantic import BaseModel, StringConstraints

from app.common import RequestBody

Credential = Annotated[str, StringConstraints(min_length=1, max_length=200)]


class LoginRequest(RequestBody):
    username: Credential
    password: Credential


class CurrentUser(BaseModel):
    username: str
