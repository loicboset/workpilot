"""REST routes for push subscriptions: one per device that accepted notifications."""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import PushSubscription
from app.db.session import SessionDep
from app.push.schemas import PushSubscriptionCreate, PushSubscriptionRead

router = APIRouter(prefix="/api/push/subscriptions", tags=["push"])


@router.post("", response_model=PushSubscriptionRead, status_code=status.HTTP_201_CREATED)
def subscribe(data: PushSubscriptionCreate, session: SessionDep) -> PushSubscription:
    """Register this device. Registering the same endpoint again updates its keys."""
    subscription = _find(session, data.endpoint) or PushSubscription(endpoint=data.endpoint)
    subscription.p256dh_key = data.keys.p256dh
    subscription.auth_key = data.keys.auth
    subscription.device_name = data.device_name
    session.add(subscription)
    session.commit()
    return subscription


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def unsubscribe(endpoint: str, session: SessionDep) -> None:
    subscription = _find(session, endpoint)
    if subscription is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "not found")
    session.delete(subscription)
    session.commit()


def _find(session: Session, endpoint: str) -> PushSubscription | None:
    stmt = select(PushSubscription).where(PushSubscription.endpoint == endpoint)
    return session.scalars(stmt).first()
