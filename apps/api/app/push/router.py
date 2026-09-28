"""REST routes for push notifications: the server's public key, and one subscription per
device that accepted notifications."""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import PushSubscription
from app.db.session import SessionDep
from app.push.schemas import PushPublicKey, PushSubscriptionCreate, PushSubscriptionRead
from app.push.vapid import public_key

router = APIRouter(prefix="/api/push", tags=["push"])


@router.get("/public-key", response_model=PushPublicKey)
def get_public_key() -> PushPublicKey:
    """What the browser passes as `applicationServerKey` when it subscribes."""
    return PushPublicKey(public_key=public_key())


@router.post(
    "/subscriptions", response_model=PushSubscriptionRead, status_code=status.HTTP_201_CREATED
)
def subscribe(data: PushSubscriptionCreate, session: SessionDep) -> PushSubscription:
    """Register this device. Registering the same endpoint again updates its keys."""
    subscription = _find(session, data.endpoint) or PushSubscription(endpoint=data.endpoint)
    subscription.p256dh_key = data.keys.p256dh
    subscription.auth_key = data.keys.auth
    subscription.device_name = data.device_name
    session.add(subscription)
    session.commit()
    return subscription


@router.delete("/subscriptions", status_code=status.HTTP_204_NO_CONTENT)
def unsubscribe(endpoint: str, session: SessionDep) -> None:
    subscription = _find(session, endpoint)
    if subscription is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "not found")
    session.delete(subscription)
    session.commit()


def _find(session: Session, endpoint: str) -> PushSubscription | None:
    stmt = select(PushSubscription).where(PushSubscription.endpoint == endpoint)
    return session.scalars(stmt).first()
