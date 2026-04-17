from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.api.deps import DBSession, require_roles
from app.api.routes.customer import _serialize_order
from app.models import RoleName
from app.schemas.common import MessageResponse
from app.schemas.order import DailyEarningResponse, OrderResponse
from app.schemas.system_config import SettingsResponse, SettingsUpdateRequest
from app.schemas.user import DeliveryBoyCreateRequest, DeliveryBoyResponse
from app.services.order_service import OrderService
from app.services.settings_service import SettingsService
from app.services.user_service import UserService


router = APIRouter()


@router.get("/dashboard")
def dashboard(
    db: DBSession,
    _=Depends(require_roles(RoleName.ROLE_ADMIN)),
):
    rows = UserService(db).list_delivery_boys()
    return {
        "deliveryBoys": [
            {
                "id": row.id,
                "full_name": row.full_name,
                "email": row.email,
                "phone_number": row.phone_number,
                "is_active": row.is_active,
                "role": row.role.name.value,
            }
            for row in rows
        ]
    }


@router.get("/orders", response_model=list[OrderResponse])
def orders(
    db: DBSession,
    _=Depends(require_roles(RoleName.ROLE_ADMIN)),
):
    return [_serialize_order(order) for order in OrderService(db).get_admin_orders()]


@router.post("/orders/{order_id}/accept", response_model=OrderResponse)
def accept_order(
    order_id: int,
    db: DBSession,
    _=Depends(require_roles(RoleName.ROLE_ADMIN)),
):
    return _serialize_order(OrderService(db).accept_order(order_id))


@router.post("/orders/{order_id}/ready", response_model=OrderResponse)
def mark_ready_to_pick(
    order_id: int,
    db: DBSession,
    _=Depends(require_roles(RoleName.ROLE_ADMIN)),
):
    return _serialize_order(OrderService(db).mark_ready_to_pick(order_id))


@router.get("/delivery-boys", response_model=list[DeliveryBoyResponse])
def delivery_boys(
    db: DBSession,
    _=Depends(require_roles(RoleName.ROLE_ADMIN)),
):
    rows = UserService(db).list_delivery_boys()
    return [
        DeliveryBoyResponse(
            id=row.id,
            full_name=row.full_name,
            email=row.email,
            phone_number=row.phone_number,
            is_active=row.is_active,
            role=row.role.name.value,
        )
        for row in rows
    ]


@router.post("/delivery-boys", response_model=DeliveryBoyResponse, status_code=status.HTTP_201_CREATED)
def create_delivery_boy(
    payload: DeliveryBoyCreateRequest,
    db: DBSession,
    _=Depends(require_roles(RoleName.ROLE_ADMIN)),
):
    row = UserService(db).create_delivery_boy(payload)
    return DeliveryBoyResponse(
        id=row.id,
        full_name=row.full_name,
        email=row.email,
        phone_number=row.phone_number,
        is_active=row.is_active,
        role=row.role.name.value,
    )


@router.post("/delivery-boys/{user_id}/toggle", response_model=DeliveryBoyResponse)
def toggle_delivery_boy(
    user_id: int,
    db: DBSession,
    _=Depends(require_roles(RoleName.ROLE_ADMIN)),
):
    row = UserService(db).toggle_delivery_boy_status(user_id)
    return DeliveryBoyResponse(
        id=row.id,
        full_name=row.full_name,
        email=row.email,
        phone_number=row.phone_number,
        is_active=row.is_active,
        role=row.role.name.value,
    )


@router.delete("/delivery-boys/{user_id}", response_model=MessageResponse)
def delete_delivery_boy(
    user_id: int,
    db: DBSession,
    _=Depends(require_roles(RoleName.ROLE_ADMIN)),
):
    UserService(db).delete_user(user_id)
    return MessageResponse(message="Delivery boy deleted successfully.")


@router.get("/settings", response_model=SettingsResponse)
def get_settings(
    db: DBSession,
    _=Depends(require_roles(RoleName.ROLE_ADMIN)),
):
    return SettingsService(db).get_settings()


@router.put("/settings", response_model=SettingsResponse)
def update_settings(
    payload: SettingsUpdateRequest,
    db: DBSession,
    _=Depends(require_roles(RoleName.ROLE_ADMIN)),
):
    return SettingsService(db).save_cod_availability(payload.is_cod_available)


@router.get("/earnings", response_model=list[DailyEarningResponse])
def earnings(
    db: DBSession,
    _=Depends(require_roles(RoleName.ROLE_ADMIN)),
):
    return OrderService(db).get_daily_earnings()
