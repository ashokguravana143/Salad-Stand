import enum

from sqlalchemy import Enum, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class RoleName(str, enum.Enum):
    ROLE_CUSTOMER = "ROLE_CUSTOMER"
    ROLE_ADMIN = "ROLE_ADMIN"
    ROLE_DELIVERY_BOY = "ROLE_DELIVERY_BOY"


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[RoleName] = mapped_column(Enum(RoleName, name="role_name"), unique=True, nullable=False)

    users = relationship("User", back_populates="role")
