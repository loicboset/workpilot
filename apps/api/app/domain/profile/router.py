"""REST routes for the profile: one per install. A 404 means onboarding isn't done yet."""

from fastapi import APIRouter

from app.common import get_singleton_or_404, put_singleton
from app.db.models import Profile
from app.db.session import SessionDep
from app.domain.profile.schemas import ProfileRead, ProfileWrite

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("", response_model=ProfileRead)
def get_profile(session: SessionDep) -> Profile:
    return get_singleton_or_404(session, Profile)


@router.put("", response_model=ProfileRead)
def put_profile(data: ProfileWrite, session: SessionDep) -> Profile:
    return put_singleton(session, Profile, data)
