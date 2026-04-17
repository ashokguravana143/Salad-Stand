from pydantic import BaseModel


class SettingsResponse(BaseModel):
    is_cod_available: bool
    razorpay_configured: bool
    razorpay_key_id: str | None = None


class SettingsUpdateRequest(BaseModel):
    is_cod_available: bool
