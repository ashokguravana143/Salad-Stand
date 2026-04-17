from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class CartOrderItemInput(BaseModel):
    menu_id: int
    quantity: int = Field(gt=0)


class OrderCreateRequest(BaseModel):
    delivery_address: str = Field(min_length=5, max_length=500)
    payment_method: str
    items: list[CartOrderItemInput]


class PaymentCreateRequest(BaseModel):
    delivery_address: str = Field(min_length=5, max_length=500)
    items: list[CartOrderItemInput]


class PaymentVerifyRequest(BaseModel):
    delivery_address: str = Field(min_length=5, max_length=500)
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    items: list[CartOrderItemInput]


class OrderResponse(BaseModel):
    id: int
    delivery_address: str
    total_amount: Decimal
    status: str
    order_time: datetime
    delivered_at: datetime | None
    payment_method: str
    customer: dict
    delivery_boy: dict | None
    items: list[dict]


class DailyEarningResponse(BaseModel):
    date: str
    total_amount: Decimal


class DeliveryEarningResponse(BaseModel):
    order_id: int
    delivery_address: str
    delivered_at: datetime
    amount: Decimal
    commission: Decimal
