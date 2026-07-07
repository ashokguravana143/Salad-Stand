from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import User
from app.models.address import Address
from app.repositories.address_repository import AddressRepository
from app.schemas.address import AddressCreateRequest, AddressUpdateRequest
from app.services.delivery_service import DeliveryService


class AddressService:
    def __init__(self, db: Session):
        self.db = db
        self.addresses = AddressRepository(db)
        self.delivery = DeliveryService()

    def list_for_user(self, user_id: int) -> list[Address]:
        return self.addresses.list_for_user(user_id)

    def create(self, user: User, payload: AddressCreateRequest) -> Address:
        self._validate_service_coordinates(payload.latitude, payload.longitude)
        if payload.is_default:
            self.addresses.clear_default_for_user(user.id)
        address = Address(user=user, **payload.model_dump())
        self.addresses.save(address)
        self.db.commit()
        return address

    def update(self, address_id: int, user: User, payload: AddressUpdateRequest) -> Address:
        address = self.addresses.get_for_user(address_id, user.id)
        if not address:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found.")
        self._validate_service_coordinates(payload.latitude, payload.longitude)
        if payload.is_default:
            self.addresses.clear_default_for_user(user.id)
        for field, value in payload.model_dump().items():
            setattr(address, field, value)
        self.addresses.save(address)
        self.db.commit()
        return address

    def delete(self, address_id: int, user: User) -> None:
        address = self.addresses.get_for_user(address_id, user.id)
        if not address:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found.")
        self.addresses.delete(address)
        self.db.commit()

    def get_for_user(self, address_id: int, user_id: int) -> Address | None:
        return self.addresses.get_for_user(address_id, user_id)

    def _validate_service_coordinates(self, latitude: float, longitude: float) -> None:
        if not self.delivery.check_availability(latitude, longitude)["available"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Service not available at your location.")
