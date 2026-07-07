from sqlalchemy.orm import Session

from app.models.address import Address


class AddressRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_for_user(self, user_id: int) -> list[Address]:
        return (
            self.db.query(Address)
            .filter(Address.user_id == user_id)
            .order_by(Address.is_default.desc(), Address.id.desc())
            .all()
        )

    def get_for_user(self, address_id: int, user_id: int) -> Address | None:
        return (
            self.db.query(Address)
            .filter(Address.id == address_id, Address.user_id == user_id)
            .first()
        )

    def clear_default_for_user(self, user_id: int) -> None:
        self.db.query(Address).filter(Address.user_id == user_id, Address.is_default.is_(True)).update(
            {Address.is_default: False},
            synchronize_session=False,
        )

    def save(self, address: Address) -> Address:
        self.db.add(address)
        self.db.flush()
        self.db.refresh(address)
        return address

    def delete(self, address: Address) -> None:
        self.db.delete(address)
