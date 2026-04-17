from fastapi import APIRouter

from app.api.routes.admin import router as admin_router
from app.api.routes.auth import router as auth_router
from app.api.routes.customer import router as customer_router
from app.api.routes.delivery import router as delivery_router
from app.api.routes.menu import router as menu_router
from app.api.routes.settings import router as settings_router


router = APIRouter()
router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(menu_router, prefix="/menu", tags=["menu"])
router.include_router(customer_router, prefix="/customer", tags=["customer"])
router.include_router(admin_router, prefix="/admin", tags=["admin"])
router.include_router(delivery_router, prefix="/delivery", tags=["delivery"])
router.include_router(settings_router, prefix="/settings", tags=["settings"])
