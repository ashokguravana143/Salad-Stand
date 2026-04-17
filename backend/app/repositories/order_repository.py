from datetime import datetime

from sqlalchemy.orm import Session, joinedload

from app.models import Order, OrderItem, OrderStatus


class OrderRepository:
    def __init__(self, db: Session):
        self.db = db

    def save(self, order: Order) -> Order:
        self.db.add(order)
        self.db.flush()
        self.db.refresh(order)
        return order

    def get(self, order_id: int) -> Order | None:
        return (
            self.db.query(Order)
            .options(
                joinedload(Order.customer),
                joinedload(Order.delivery_boy),
                joinedload(Order.items).joinedload(OrderItem.salad),
            )
            .filter(Order.id == order_id)
            .first()
        )

    def get_for_customer(self, customer_id: int) -> list[Order]:
        return (
            self.db.query(Order)
            .options(joinedload(Order.customer), joinedload(Order.delivery_boy), joinedload(Order.items).joinedload(OrderItem.salad))
            .filter(Order.customer_id == customer_id)
            .order_by(Order.order_time.desc())
            .all()
        )

    def get_admin_orders(self) -> list[Order]:
        return (
            self.db.query(Order)
            .options(joinedload(Order.customer), joinedload(Order.items).joinedload(OrderItem.salad))
            .filter(Order.status.in_([OrderStatus.PENDING, OrderStatus.ACCEPTED]))
            .order_by(Order.order_time.asc())
            .all()
        )

    def get_ready_to_pick_orders(self) -> list[Order]:
        return (
            self.db.query(Order)
            .options(joinedload(Order.customer), joinedload(Order.items).joinedload(OrderItem.salad))
            .filter(Order.status == OrderStatus.READY_TO_PICK)
            .order_by(Order.order_time.asc())
            .all()
        )

    def get_for_delivery_boy(self, delivery_boy_id: int) -> list[Order]:
        return (
            self.db.query(Order)
            .options(joinedload(Order.customer), joinedload(Order.items).joinedload(OrderItem.salad))
            .filter(Order.delivery_boy_id == delivery_boy_id)
            .order_by(Order.order_time.desc())
            .all()
        )

    def get_delivered_for_delivery_boy(self, delivery_boy_id: int) -> list[Order]:
        return (
            self.db.query(Order)
            .options(joinedload(Order.customer), joinedload(Order.items).joinedload(OrderItem.salad))
            .filter(Order.delivery_boy_id == delivery_boy_id, Order.status == OrderStatus.DELIVERED)
            .order_by(Order.order_time.desc())
            .all()
        )

    def get_delivered_since(self, delivered_at: datetime) -> list[Order]:
        return (
            self.db.query(Order)
            .options(joinedload(Order.customer), joinedload(Order.delivery_boy))
            .filter(Order.status == OrderStatus.DELIVERED, Order.delivered_at >= delivered_at)
            .order_by(Order.delivered_at.desc())
            .all()
        )
