from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import DBSession, require_roles
from app.models import OrderPaymentMethod, RoleName, User
from app.schemas.order import OrderCreateRequest, OrderResponse, PaymentCreateRequest, PaymentVerifyRequest
from app.services.order_service import OrderService
from app.services.payment_service import PaymentService
from app.services.settings_service import SettingsService


router = APIRouter()


def _serialize_order(order) -> OrderResponse:
    return OrderResponse(
        id=order.id,
        delivery_address=order.delivery_address,
        total_amount=order.total_amount,
        status=order.status.value,
        order_time=order.order_time,
        delivered_at=order.delivered_at,
        payment_method=order.payment_method.value,
        customer={
            "id": order.customer.id,
            "full_name": order.customer.full_name,
            "email": order.customer.email,
            "phone_number": order.customer.phone_number,
        },
        delivery_boy=(
            {
                "id": order.delivery_boy.id,
                "full_name": order.delivery_boy.full_name,
                "email": order.delivery_boy.email,
                "phone_number": order.delivery_boy.phone_number,
            }
            if order.delivery_boy
            else None
        ),
        items=[
            {
                "id": item.id,
                "salad_id": item.salad.id,
                "salad_name": item.salad.name,
                "quantity": item.quantity,
                "price": item.price,
            }
            for item in order.items
        ],
    )


@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def place_order(
    payload: OrderCreateRequest,
    db: DBSession,
    user: Annotated[User, Depends(require_roles(RoleName.ROLE_CUSTOMER))],
):
    try:
        payment_method = OrderPaymentMethod(payload.payment_method.upper())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid payment method.") from exc
    if payment_method == OrderPaymentMethod.COD and not SettingsService(db).get_settings().is_cod_available:
        raise HTTPException(status_code=400, detail="Cash on Delivery is unavailable right now.")
    order = OrderService(db).create_order(
        user,
        payload.delivery_address,
        payment_method,
        payload.items,
    )
    return _serialize_order(order)


@router.get("/orders/my", response_model=list[OrderResponse])
def my_orders(
    db: DBSession,
    user: Annotated[User, Depends(require_roles(RoleName.ROLE_CUSTOMER))],
):
    return [_serialize_order(order) for order in OrderService(db).get_customer_orders(user.id)]


@router.post("/payments/create-order")
async def create_online_payment_order(
    payload: PaymentCreateRequest,
    db: DBSession,
    user: Annotated[User, Depends(require_roles(RoleName.ROLE_CUSTOMER))],
):
    _, total = OrderService(db)._resolve_cart_items(payload.items)
    razorpay_order = await PaymentService().create_order(total)
    return {
        "success": True,
        "key": PaymentService.get_key_id(),
        "amount": razorpay_order["amount"],
        "currency": razorpay_order["currency"],
        "orderId": razorpay_order["id"],
        "name": "SaladStand",
        "description": "Fresh salad order",
        "customerName": user.full_name,
        "customerEmail": user.email,
        "customerPhone": user.phone_number or "",
    }


@router.post("/payments/verify")
def verify_online_payment(
    payload: PaymentVerifyRequest,
    db: DBSession,
    user: Annotated[User, Depends(require_roles(RoleName.ROLE_CUSTOMER))],
):
    verified = PaymentService().verify_signature(
        payload.razorpay_order_id,
        payload.razorpay_payment_id,
        payload.razorpay_signature,
    )
    if not verified:
        return {"success": False, "redirectUrl": "/checkout?paymentFailed=true"}
    order = OrderService(db).create_order(user, payload.delivery_address, OrderPaymentMethod.ONLINE, payload.items)
    return {"success": True, "redirectUrl": f"/order-success?orderId={order.id}"}
