from pydantic import BaseModel


class ServiceAvailabilityRequest(BaseModel):
    latitude: float
    longitude: float


class ServiceAvailabilityResponse(BaseModel):
    available: bool
    distance_km: float
    radius_km: float
    delivery_fee: float
    estimated_delivery_time_minutes: int
    message: str
