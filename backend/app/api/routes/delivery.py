from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import DBSession, require_roles
from app.api.routes.customer import _serialize_order
from app.models import RoleName, User
from app.schemas.order import DeliveryEarningResponse, OrderResponse
from app.services.order_service import OrderService


router = APIRouter()


@router.get("/dashboard", response_model=list[OrderResponse])
def ready_orders(
    db: DBSession,
    _: Annotated[User, Depends(require_roles(RoleName.ROLE_DELIVERY_BOY))],
):
    return [_serialize_order(order) for order in OrderService(db).get_ready_orders()]


@router.get("/my-deliveries", response_model=list[OrderResponse])
def my_deliveries(
    db: DBSession,
    user: Annotated[User, Depends(require_roles(RoleName.ROLE_DELIVERY_BOY))],
):
    return [_serialize_order(order) for order in OrderService(db).get_delivery_orders(user.id)]


@router.post("/pickup/{order_id}", response_model=OrderResponse)
def pickup(
    order_id: int,
    db: DBSession,
    user: Annotated[User, Depends(require_roles(RoleName.ROLE_DELIVERY_BOY))],
):
    return _serialize_order(OrderService(db).pick_up_order(order_id, user))


@router.post("/deliver/{order_id}", response_model=OrderResponse)
def deliver(
    order_id: int,
    db: DBSession,
    _: Annotated[User, Depends(require_roles(RoleName.ROLE_DELIVERY_BOY))],
):
    return _serialize_order(OrderService(db).deliver_order(order_id))


@router.get("/my-earnings")
def my_earnings(
    db: DBSession,
    user: Annotated[User, Depends(require_roles(RoleName.ROLE_DELIVERY_BOY))],
):
    total, rows = OrderService(db).get_delivery_earnings(user.id)
    return {
        "total_earnings": total,
        "delivery_earnings": [DeliveryEarningResponse(**row) for row in rows],
    }
