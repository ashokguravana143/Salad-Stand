from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import SystemConfig
from app.repositories.system_config_repository import SystemConfigRepository
from app.schemas.system_config import SettingsResponse


class SettingsService:
    def __init__(self, db: Session):
        self.db = db
        self.configs = SystemConfigRepository(db)

    def get_settings(self) -> SettingsResponse:
        config = self.configs.get_by_key("isCodAvailable")
        return SettingsResponse(
            is_cod_available=(config.config_value.lower() == "true") if config else False,
            razorpay_configured=self.is_razorpay_configured(),
            razorpay_key_id=settings.razorpay_key_id or None,
        )

    def save_cod_availability(self, enabled: bool) -> SettingsResponse:
        config = self.configs.get_by_key("isCodAvailable")
        if not config:
            config = SystemConfig(config_key="isCodAvailable", config_value="true")
        config.config_value = str(enabled).lower()
        self.configs.save(config)
        self.db.commit()
        return self.get_settings()

    @staticmethod
    def is_razorpay_configured() -> bool:
        return bool(settings.razorpay_key_id.strip() and settings.razorpay_key_secret.strip())
