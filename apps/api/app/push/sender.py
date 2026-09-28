"""Sending one push message to one device (ADR 0011)."""

import json
import logging
from enum import StrEnum

import requests
from pywebpush import WebPushException, webpush

from app.config import settings
from app.db.models import PushSubscription
from app.push.vapid import vapid_key

logger = logging.getLogger(__name__)

TIMEOUT_SECONDS = 10
# How long the push service keeps the message for a device that is offline.
TTL_SECONDS = 12 * 60 * 60


class Delivery(StrEnum):
    DELIVERED = "delivered"
    GONE = "gone"  # the device unsubscribed, or its subscription expired: forget it
    FAILED = "failed"  # refused for good, e.g. a VAPID contact Apple won't accept
    RETRY = "retry"  # the network or the push service had trouble: worth another try


def send_push(
    device: PushSubscription,
    message: dict[str, str],
    http: requests.Session | None = None,  # tests pass a fake one
) -> Delivery:
    """Send `message` (as JSON) to the device's push service, which passes it to the device."""
    if settings.push_contact is None:
        raise RuntimeError("WORKPILOT_PUSH_CONTACT is not set")
    try:
        webpush(
            subscription_info={
                "endpoint": device.endpoint,
                "keys": {"p256dh": device.p256dh_key, "auth": device.auth_key},
            },
            data=json.dumps(message),
            vapid_private_key=vapid_key(),
            vapid_claims={"sub": settings.push_contact},
            ttl=TTL_SECONDS,
            headers={"Urgency": "high"},  # a reminder is worth waking a sleeping phone
            timeout=TIMEOUT_SECONDS,
            requests_session=http,
        )
    except requests.RequestException:
        return Delivery.RETRY
    except WebPushException as error:
        return _delivery_for_status(error.status_code, error)
    return Delivery.DELIVERED


def _delivery_for_status(status_code: int | None, error: WebPushException) -> Delivery:
    if status_code in (404, 410):
        return Delivery.GONE
    if status_code is None or status_code == 429 or status_code >= 500:
        return Delivery.RETRY
    logger.warning("Push service refused a message: %s", error)
    return Delivery.FAILED
