from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import DBSession, get_current_user
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserSummary
from app.services.auth_service import AuthService


router = APIRouter()


@router.post("/register", response_model=UserSummary)
def register(payload: RegisterRequest, db: DBSession):
    return AuthService(db).register_customer(payload)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: DBSession):
    return AuthService(db).login(payload)


@router.get("/me", response_model=UserSummary)
def me(user=Depends(get_current_user)):
    return UserSummary(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone_number=user.phone_number,
        is_active=user.is_active,
        role=user.role.name.value,
    )
