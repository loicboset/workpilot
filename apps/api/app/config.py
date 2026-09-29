"""Settings, read from WORKPILOT_* environment variables (see .env.example).

WorkPilot refuses to start without its own login and secret: the placeholders from
.env.example are rejected, so an install can't go online with a password anyone can read.
"""

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# The values .env.example ships with; they must be replaced.
PLACEHOLDER = "change-me"
MIN_SECRET_LENGTH = 32


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="WORKPILOT_",
        # ".env" next to the API, or the repo-root .env when running from apps/api in development.
        env_file=(".env", "../../.env"),
        extra="ignore",
        hide_input_in_errors=True,  # never print a password or secret in a startup error
    )

    # Single-user login, "name:password" (ADR 0003).
    user: str = ""
    # Signs the session cookie, encrypts stored secrets (the AI key) and derives the push key.
    secret_key: str = ""
    # Send the session cookie over HTTPS only. Set to false for local development over http.
    cookie_secure: bool = True

    database_url: str = "postgresql+psycopg://workpilot:workpilot@localhost:5432/workpilot"

    # Who push services can contact about this server's notifications: "mailto:you@example.org"
    # or your site's https URL. Apple refuses made-up addresses. Unset: no reminders are sent.
    push_contact: str | None = None

    # The AI provider is configured in the app and stored in the ai_settings table (ADR 0021),
    # not here.

    @field_validator("user")
    @classmethod
    def user_has_name_and_password(cls, value: str) -> str:
        name, _, password = value.partition(":")
        if not name or not password:
            raise ValueError('Set WORKPILOT_USER in .env, as "name:password"')
        if password == PLACEHOLDER:
            raise ValueError("Choose your own password in WORKPILOT_USER (.env)")
        return value

    @field_validator("secret_key")
    @classmethod
    def secret_key_is_long_and_random(cls, value: str) -> str:
        if value == PLACEHOLDER or len(value) < MIN_SECRET_LENGTH:
            raise ValueError(
                f"WORKPILOT_SECRET_KEY must be at least {MIN_SECRET_LENGTH} random characters. "
                "Run `make env`, or generate one with: "
                'python3 -c "import secrets; print(secrets.token_urlsafe(48))"'
            )
        return value

    @field_validator("push_contact")
    @classmethod
    def push_contact_is_mailto_or_https(cls, value: str | None) -> str | None:
        if not value:
            return None  # left empty in .env: reminders are off
        if not value.startswith(("mailto:", "https://")):
            raise ValueError('WORKPILOT_PUSH_CONTACT must start with "mailto:" or "https://"')
        return value

    @property
    def login(self) -> tuple[str, str]:
        """The configured (username, password)."""
        name, _, password = self.user.partition(":")
        return name, password


settings = Settings()
