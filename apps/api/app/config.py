"""Settings, read from WORKPILOT_* environment variables (see .env.example)."""

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="WORKPILOT_",
        # ".env" next to the API, or the repo-root .env when running from apps/api in development.
        env_file=(".env", "../../.env"),
        extra="ignore",
    )

    # Single-user login, "name:password" (ADR 0003).
    # TODO(auth): refuse to start with these defaults outside development.
    user: str = "me:change-me"
    # Signs the session cookie and encrypts stored secrets such as the AI key.
    secret_key: str = "change-me"
    # Send the session cookie over HTTPS only. Set to false for local development over http.
    cookie_secure: bool = True

    database_url: str = "postgresql+psycopg://workpilot:workpilot@localhost:5432/workpilot"

    # The AI provider is configured in the app and stored in the ai_settings table (ADR 0021),
    # not here.

    @field_validator("user")
    @classmethod
    def user_has_name_and_password(cls, value: str) -> str:
        name, _, password = value.partition(":")
        if not name or not password:
            raise ValueError('WORKPILOT_USER must look like "name:password"')
        return value

    @property
    def login(self) -> tuple[str, str]:
        """The configured (username, password)."""
        name, _, password = self.user.partition(":")
        return name, password


settings = Settings()
