from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "SaladStand API"
    environment: str = "development"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"
    secret_key: str
    access_token_expire_minutes: int = 1440
    database_url: str
    frontend_url: str = "http://localhost:4200"
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    service_latitude: float = 18.4530
    service_longitude: float = 83.6620
    service_radius_km: float = 15.0
    base_delivery_fee: float = 0.0
    delivery_fee_per_km: float = 5.0
    base_delivery_eta_minutes: int = 20
    extra_eta_per_km_minutes: int = 4


settings = Settings()
