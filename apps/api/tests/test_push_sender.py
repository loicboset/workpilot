"""Sending one push message: real encryption and VAPID signing, a fake push service."""

import base64
import json
import os
from dataclasses import dataclass

import http_ece
import pytest
import requests
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
from fastapi.testclient import TestClient

from app.db.models import PushSubscription
from app.push.sender import TTL_SECONDS, Delivery, send_push
from app.push.vapid import public_key


class FakePushService(requests.adapters.BaseAdapter):
    """Answers every request with `status_code`, or raises `error`; keeps what it received."""

    def __init__(self, status_code: int = 201, error: Exception | None = None) -> None:
        super().__init__()
        self.status_code = status_code
        self.error = error
        self.received: list[requests.PreparedRequest] = []

    def send(self, request: requests.PreparedRequest, **_kwargs) -> requests.Response:
        self.received.append(request)
        if self.error is not None:
            raise self.error
        response = requests.Response()
        response.status_code = self.status_code
        response.request = request
        response._content = b""
        return response

    def close(self) -> None:
        pass


def base64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


@dataclass
class Browser:
    """A browser's side of a subscription: the keys it keeps to read its messages."""

    private_key: ec.EllipticCurvePrivateKey
    auth_secret: bytes

    @classmethod
    def new(cls) -> "Browser":
        return cls(ec.generate_private_key(ec.SECP256R1()), os.urandom(16))

    def subscription(self) -> PushSubscription:
        point = self.private_key.public_key().public_bytes(
            Encoding.X962, PublicFormat.UncompressedPoint
        )
        return PushSubscription(
            endpoint="https://push.example.com/send/abc",
            p256dh_key=base64url(point),
            auth_key=base64url(self.auth_secret),
        )

    def read(self, body: bytes) -> dict[str, str]:
        plain = http_ece.decrypt(body, private_key=self.private_key, auth_secret=self.auth_secret)
        return json.loads(plain)


MESSAGE = {"type": "reminder", "id": "1", "text": "Call the editor"}


def send_to(service: FakePushService, browser: Browser | None = None) -> Delivery:
    http = requests.Session()
    http.mount("https://", service)
    return send_push((browser or Browser.new()).subscription(), MESSAGE, http=http)


def test_a_delivered_message_is_signed_and_only_the_browser_can_read_it() -> None:
    service = FakePushService(status_code=201)
    browser = Browser.new()

    assert send_to(service, browser) is Delivery.DELIVERED

    request = service.received[0]
    assert request.url == "https://push.example.com/send/abc"
    assert request.headers["Content-Encoding"] == "aes128gcm"
    assert request.headers["TTL"] == str(TTL_SECONDS)
    assert request.headers["Urgency"] == "high"
    assert request.headers["Authorization"].startswith("vapid t=")
    assert public_key() in request.headers["Authorization"]
    assert b"Call the editor" not in request.body
    assert browser.read(request.body) == MESSAGE


@pytest.mark.parametrize(
    ("service", "delivery"),
    [
        (FakePushService(status_code=410), Delivery.GONE),
        (FakePushService(status_code=404), Delivery.GONE),
        (FakePushService(status_code=429), Delivery.RETRY),
        (FakePushService(status_code=503), Delivery.RETRY),
        (FakePushService(status_code=403), Delivery.FAILED),
        (FakePushService(error=requests.ConnectionError("offline")), Delivery.RETRY),
    ],
    ids=["unsubscribed", "expired", "rate-limited", "unavailable", "refused", "offline"],
)
def test_push_service_answers(service: FakePushService, delivery: Delivery) -> None:
    assert send_to(service) is delivery


def test_the_public_key_is_the_one_messages_are_signed_with(client: TestClient) -> None:
    assert client.get("/api/push/public-key").json() == {"public_key": public_key()}
