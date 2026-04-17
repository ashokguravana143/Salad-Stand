from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserSummary(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    phone_number: str | None
    is_active: bool
    role: str


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    phone_number: str = Field(min_length=7, max_length=20)
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserSummary
