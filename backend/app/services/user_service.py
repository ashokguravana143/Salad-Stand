from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models import RoleName, User
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository
from app.schemas.user import DeliveryBoyCreateRequest


class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.users = UserRepository(db)
        self.roles = RoleRepository(db)

    def get_by_email(self, email: str) -> User | None:
        return self.users.get_by_email(email)

    def list_delivery_boys(self) -> list[User]:
        return self.users.list_delivery_boys()

    def create_delivery_boy(self, payload: DeliveryBoyCreateRequest) -> User:
        if self.users.exists_by_email(payload.email):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists.")
        role = self.roles.get_by_name(RoleName.ROLE_DELIVERY_BOY)
        if not role:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Delivery role missing.")
        user = User(
            email=payload.email,
            password_hash=get_password_hash(payload.password),
            full_name=payload.full_name,
            phone_number=payload.phone_number,
            is_active=True,
            role=role,
        )
        self.users.save(user)
        self.db.commit()
        return user

    def toggle_delivery_boy_status(self, user_id: int) -> User:
        user = self.users.get(user_id)
        if not user or user.role.name != RoleName.ROLE_DELIVERY_BOY:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery boy not found.")
        user.is_active = not user.is_active
        self.users.save(user)
        self.db.commit()
        return user

    def delete_user(self, user_id: int) -> None:
        user = self.users.get(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        self.users.delete(user)
        self.db.commit()
