from sqlalchemy.orm import Session

from app.models import RoleName, User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, user_id: int) -> User | None:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> User | None:
        return self.db.query(User).filter(User.email == email).first()

    def exists_by_email(self, email: str) -> bool:
        return self.db.query(User).filter(User.email == email).first() is not None

    def list_delivery_boys(self) -> list[User]:
        return (
            self.db.query(User)
            .join(User.role)
            .filter(User.role.has(name=RoleName.ROLE_DELIVERY_BOY))
            .order_by(User.full_name.asc())
            .all()
        )

    def save(self, user: User) -> User:
        self.db.add(user)
        self.db.flush()
        self.db.refresh(user)
        return user

    def delete(self, user: User) -> None:
        self.db.delete(user)
