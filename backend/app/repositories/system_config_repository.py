from sqlalchemy.orm import Session

from app.models import SystemConfig


class SystemConfigRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_key(self, key: str) -> SystemConfig | None:
        return self.db.query(SystemConfig).filter(SystemConfig.config_key == key).first()

    def save(self, config: SystemConfig) -> SystemConfig:
        self.db.add(config)
        self.db.flush()
        self.db.refresh(config)
        return config
