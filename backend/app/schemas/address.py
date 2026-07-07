from pydantic import BaseModel, Field

from app.models.address import AddressLabel


class AddressBase(BaseModel):
    label: AddressLabel
    formatted_address: str = Field(min_length=5, max_length=500)
    door_flat_no: str = Field(min_length=1, max_length=120)
    street_name: str = Field(min_length=2, max_length=255)
    landmark: str | None = Field(default=None, max_length=255)
    city: str = Field(min_length=2, max_length=120)
    pincode: str = Field(min_length=4, max_length=20)
    latitude: float
    longitude: float
    is_default: bool = False


class AddressCreateRequest(AddressBase):
    pass


class AddressUpdateRequest(AddressBase):
    pass


class AddressResponse(AddressBase):
    id: int
    distance_km: float | None = None
    is_serviceable: bool | None = None
