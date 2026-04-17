from collections import defaultdict
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Menu, Order, OrderItem, OrderPaymentMethod, OrderStatus, User
from app.repositories.menu_repository import MenuRepository
from app.repositories.order_repository import OrderRepository
from app.schemas.order import CartOrderItemInput


class OrderService:
    DELIVERY_COMMISSION_RATE = Decimal("0.20")

    def __init__(self, db: Session):
        self.db = db
        self.orders = OrderRepository(db)
        self.menu = MenuRepository(db)

    def _resolve_cart_items(self, items: list[CartOrderItemInput]) -> tuple[list[tuple[Menu, int]], Decimal]:
        if not items:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Your cart is empty.")
        resolved: list[tuple[Menu, int]] = []
        total = Decimal("0.00")
        for item in items:
            menu = self.menu.get(item.menu_id)
            if not menu or not menu.available:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="One or more salads are unavailable.")
            resolved.append((menu, item.quantity))
            total += menu.price * item.quantity
        return resolved, total.quantize(Decimal("0.01"))

    def create_order(self, customer: User, delivery_address: str, payment_method: OrderPaymentMethod, items: list[CartOrderItemInput]) -> Order:
        resolved_items, total = self._resolve_cart_items(items)
        order = Order(
            customer=customer,
            delivery_address=delivery_address,
            total_amount=total,
            status=OrderStatus.PENDING,
            order_time=datetime.now(),
            payment_method=payment_method,
        )
        self.orders.save(order)
        for menu, quantity in resolved_items:
            order.items.append(OrderItem(order=order, salad=menu, quantity=quantity, price=menu.price))
        self.db.add(order)
        self.db.commit()
        return self.orders.get(order.id)

    def get_customer_orders(self, customer_id: int) -> list[Order]:
        return self.orders.get_for_customer(customer_id)

    def get_admin_orders(self) -> list[Order]:
        return self.orders.get_admin_orders()

    def get_ready_orders(self) -> list[Order]:
        return self.orders.get_ready_to_pick_orders()

    def get_delivery_orders(self, delivery_boy_id: int) -> list[Order]:
        return self.orders.get_for_delivery_boy(delivery_boy_id)

    def accept_order(self, order_id: int) -> Order:
        order = self.orders.get(order_id)
        if not order or order.status != OrderStatus.PENDING:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order cannot be accepted.")
        order.status = OrderStatus.ACCEPTED
        self.db.commit()
        return self.orders.get(order.id)

    def mark_ready_to_pick(self, order_id: int) -> Order:
        order = self.orders.get(order_id)
        if not order or order.status != OrderStatus.ACCEPTED:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order cannot be marked ready.")
        order.status = OrderStatus.READY_TO_PICK
        self.db.commit()
        return self.orders.get(order.id)

    def pick_up_order(self, order_id: int, delivery_boy: User) -> Order:
        order = self.orders.get(order_id)
        if not order or order.status != OrderStatus.READY_TO_PICK:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order is not ready to pick.")
        order.status = OrderStatus.PICKED_UP
        order.delivery_boy = delivery_boy
        self.db.commit()
        return self.orders.get(order.id)

    def deliver_order(self, order_id: int) -> Order:
        order = self.orders.get(order_id)
        if not order or order.status != OrderStatus.PICKED_UP:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order cannot be delivered.")
        order.status = OrderStatus.DELIVERED
        order.delivered_at = datetime.now()
        self.db.commit()
        return self.orders.get(order.id)

    def get_daily_earnings(self) -> list[dict]:
        cutoff = datetime.now() - timedelta(days=89)
        grouped: dict[str, Decimal] = defaultdict(lambda: Decimal("0.00"))
        for order in self.orders.get_delivered_since(cutoff):
            key = (order.delivered_at or order.order_time).date().isoformat()
            grouped[key] += order.total_amount
        return [{"date": date, "total_amount": total.quantize(Decimal("0.01"))} for date, total in sorted(grouped.items(), reverse=True)]

    def get_delivery_earnings(self, delivery_boy_id: int) -> tuple[Decimal, list[dict]]:
        delivered_orders = self.orders.get_delivered_for_delivery_boy(delivery_boy_id)
        rows: list[dict] = []
        total = Decimal("0.00")
        for order in delivered_orders:
            commission = self._commission(order.total_amount)
            total += commission
            rows.append(
                {
                    "order_id": order.id,
                    "delivery_address": order.delivery_address,
                    "delivered_at": order.delivered_at or order.order_time,
                    "amount": order.total_amount,
                    "commission": commission,
                }
            )
        return total.quantize(Decimal("0.01")), rows

    def _commission(self, amount: Decimal) -> Decimal:
        return (amount * self.DELIVERY_COMMISSION_RATE).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
