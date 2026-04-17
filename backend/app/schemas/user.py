from pydantic import BaseModel, EmailStr, Field


class DeliveryBoyCreateRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    phone_number: str = Field(min_length=7, max_length=20)
    password: str = Field(min_length=6, max_length=128)


class DeliveryBoyResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone_number: str | None
    is_active: bool
    role: str
