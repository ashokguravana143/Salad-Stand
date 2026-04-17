from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, get_password_hash, verify_password
from app.models import RoleName, User
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserSummary


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.users = UserRepository(db)
        self.roles = RoleRepository(db)

    def register_customer(self, payload: RegisterRequest) -> UserSummary:
        if self.users.exists_by_email(payload.email):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists.")
        customer_role = self.roles.get_by_name(RoleName.ROLE_CUSTOMER)
        if not customer_role:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Customer role missing.")
        user = User(
            email=payload.email,
            password_hash=get_password_hash(payload.password),
            full_name=payload.full_name,
            phone_number=payload.phone_number,
            is_active=True,
            role=customer_role,
        )
        self.users.save(user)
        self.db.commit()
        return self._to_summary(user)

    def login(self, payload: LoginRequest) -> TokenResponse:
        user = self.users.get_by_email(payload.email)
        if not user or not verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")
        return TokenResponse(
            access_token=create_access_token(user.email, user.role.name.value),
            user=self._to_summary(user),
        )

    def _to_summary(self, user: User) -> UserSummary:
        return UserSummary(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            phone_number=user.phone_number,
            is_active=user.is_active,
            role=user.role.name.value,
        )
