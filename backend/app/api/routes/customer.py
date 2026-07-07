from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.api.deps import DBSession, require_roles
from app.models import OrderPaymentMethod, RoleName, User
from app.schemas.address import AddressCreateRequest, AddressResponse, AddressUpdateRequest
from app.schemas.order import OrderCreateRequest, OrderResponse, PaymentCreateRequest, PaymentVerifyRequest
from app.services.address_service import AddressService
from app.services.order_service import OrderService
from app.services.payment_service import PaymentService
from app.services.settings_service import SettingsService
from app.services.delivery_service import DeliveryService


router = APIRouter()


def _resolve_address_payload(db, user: User, payload):
    if not payload.address_id:
        return payload.delivery_address, payload.latitude, payload.longitude

    address = AddressService(db).get_for_user(payload.address_id, user.id)
    if not address:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found.")

    summary = ", ".join(
        part
        for part in [
            address.door_flat_no,
            address.street_name,
            address.landmark,
            address.city,
            address.pincode,
        ]
        if part
    )
    return summary, address.latitude, address.longitude


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


def _serialize_address(address) -> AddressResponse:
    availability = DeliveryService().check_availability(address.latitude, address.longitude)
    return AddressResponse(
        id=address.id,
        label=address.label,
        formatted_address=address.formatted_address,
        door_flat_no=address.door_flat_no,
        street_name=address.street_name,
        landmark=address.landmark,
        city=address.city,
        pincode=address.pincode,
        latitude=address.latitude,
        longitude=address.longitude,
        is_default=address.is_default,
        distance_km=availability["distance_km"],
        is_serviceable=availability["available"],
    )


@router.get("/addresses", response_model=list[AddressResponse])
def my_addresses(
    db: DBSession,
    user: Annotated[User, Depends(require_roles(RoleName.ROLE_CUSTOMER))],
):
    return [_serialize_address(address) for address in AddressService(db).list_for_user(user.id)]


@router.post("/addresses", response_model=AddressResponse, status_code=status.HTTP_201_CREATED)
def create_address(
    payload: AddressCreateRequest,
    db: DBSession,
    user: Annotated[User, Depends(require_roles(RoleName.ROLE_CUSTOMER))],
):
    return _serialize_address(AddressService(db).create(user, payload))


@router.put("/addresses/{address_id}", response_model=AddressResponse)
def update_address(
    address_id: int,
    payload: AddressUpdateRequest,
    db: DBSession,
    user: Annotated[User, Depends(require_roles(RoleName.ROLE_CUSTOMER))],
):
    return _serialize_address(AddressService(db).update(address_id, user, payload))


@router.delete("/addresses/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_address(
    address_id: int,
    db: DBSession,
    user: Annotated[User, Depends(require_roles(RoleName.ROLE_CUSTOMER))],
):
    AddressService(db).delete(address_id, user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


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
    delivery_address, latitude, longitude = _resolve_address_payload(db, user, payload)
    order = OrderService(db).create_order(
        user,
        delivery_address,
        latitude,
        longitude,
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
    delivery_address, latitude, longitude = _resolve_address_payload(db, user, payload)
    availability = DeliveryService().check_availability(latitude, longitude)
    if not availability["available"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Service not available at your location.")
    _, items_total = OrderService(db)._resolve_cart_items(payload.items)
    delivery_fee = Decimal(str(availability["delivery_fee"]))
    total = items_total + delivery_fee
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
    delivery_address, latitude, longitude = _resolve_address_payload(db, user, payload)
    order = OrderService(db).create_order(
        user,
        delivery_address,
        latitude,
        longitude,
        OrderPaymentMethod.ONLINE,
        payload.items,
    )
    return {"success": True, "redirectUrl": f"/order-success?orderId={order.id}"}
