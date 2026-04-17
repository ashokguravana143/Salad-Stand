from fastapi import APIRouter

from app.api.deps import DBSession
from app.schemas.system_config import SettingsResponse
from app.services.settings_service import SettingsService


router = APIRouter()


@router.get("/public", response_model=SettingsResponse)
def public_settings(db: DBSession):
    return SettingsService(db).get_settings()
