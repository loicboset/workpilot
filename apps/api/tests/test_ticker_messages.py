from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.enums import TickerKind
from app.db.models import TickerMessage


def test_latest_messages_first_with_limit(client: TestClient, db: Session) -> None:
    for number in range(3):
        db.add(TickerMessage(kind=TickerKind.TIP, text=f"tip {number}"))
        db.commit()

    messages = client.get("/api/ticker-messages", params={"limit": 2}).json()

    assert [message["text"] for message in messages] == ["tip 2", "tip 1"]


def test_ticker_is_read_only(client: TestClient) -> None:
    response = client.post("/api/ticker-messages", json={"kind": "tip", "text": "x"})
    assert response.status_code == 405
