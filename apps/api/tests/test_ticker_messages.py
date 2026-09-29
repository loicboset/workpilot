from collections.abc import Iterator
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import pytest
from fastapi.testclient import TestClient
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.ai.service import configured_provider
from app.db.base import utcnow
from app.db.enums import Locale, TickerKind
from app.db.models import Milestone, NorthStar, Profile, TickerMessage, Todo
from app.main import app


def test_latest_messages_first_with_limit(client: TestClient, db: Session) -> None:
    for number in range(3):
        db.add(TickerMessage(kind=TickerKind.TIP, text=f"tip {number}"))
        db.commit()

    messages = client.get("/api/ticker-messages", params={"limit": 2}).json()

    assert [message["text"] for message in messages] == ["tip 2", "tip 1"]


def test_ticker_is_read_only(client: TestClient) -> None:
    response = client.post("/api/ticker-messages", json={"kind": "tip", "text": "x"})
    assert response.status_code == 405


# --- Refresh (AI) ---------------------------------------------------------------------------


class FakeTickerAI:
    """Answers five messages and remembers the prompt it was given."""

    def __init__(self) -> None:
        self.prompts: list[str] = []

    def generate[Answer: BaseModel](self, prompt: str, answer: type[Answer]) -> Answer:
        self.prompts.append(prompt)
        kinds = ["insight", "tip", "guidance", "nudge", "quote"]
        return answer.model_validate(
            {"messages": [{"kind": kind, "text": f"A calm {kind}"} for kind in kinds]}
        )

    def list_models(self) -> list[str]:
        return []


@pytest.fixture
def fake_ai() -> Iterator[FakeTickerAI]:
    ai = FakeTickerAI()
    app.dependency_overrides[configured_provider] = lambda: ai
    yield ai
    app.dependency_overrides.clear()


def test_refresh_asks_the_ai_with_the_users_context(
    client: TestClient, db: Session, fake_ai: FakeTickerAI
) -> None:
    db.add(Profile(first_name="Loïc", locale=Locale.FR, timezone="Europe/Zurich"))
    north_star = NorthStar(title="Finish my first novel")
    db.add(north_star)
    db.flush()
    db.add(Milestone(north_star_id=north_star.id, title="First draft"))
    today = datetime.now(ZoneInfo("Europe/Zurich")).date()
    db.add(Todo(title="Outline chapter 3", due_date=today, priority=1))
    db.commit()

    messages = client.post("/api/ticker-messages/refresh").json()

    assert [message["kind"] for message in messages] == [
        "insight",
        "tip",
        "guidance",
        "nudge",
        "quote",
    ]
    prompt = fake_ai.prompts[0]
    for expected in [
        "Loïc",
        "French",
        "Finish my first novel",
        "First draft (ahead)",
        "Outline chapter 3 (priority 1)",
    ]:
        assert expected in prompt


def test_fresh_messages_are_kept(client: TestClient, db: Session, fake_ai: FakeTickerAI) -> None:
    db.add(TickerMessage(kind=TickerKind.TIP, text="Still fresh"))
    db.commit()

    messages = client.post("/api/ticker-messages/refresh").json()

    assert [message["text"] for message in messages] == ["Still fresh"]
    assert fake_ai.prompts == []


def test_stale_messages_are_replaced(
    client: TestClient, db: Session, fake_ai: FakeTickerAI
) -> None:
    old = TickerMessage(kind=TickerKind.TIP, text="Old", created_at=utcnow() - timedelta(hours=7))
    db.add(old)
    db.commit()

    client.post("/api/ticker-messages/refresh")

    db.refresh(old)
    assert old.deleted_at is not None  # devices drop it on their next sync
    assert len(client.get("/api/ticker-messages").json()) == 5


def test_refresh_needs_an_ai_provider(client: TestClient) -> None:
    response = client.post("/api/ticker-messages/refresh")

    assert response.status_code == 409
    assert response.json() == {"detail": "ai_not_configured"}
