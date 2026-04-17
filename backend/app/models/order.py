import enum
from datetime import datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class OrderPaymentMethod(str, enum.Enum):
    ONLINE = "ONLINE"
    COD = "COD"


class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    READY_TO_PICK = "READY_TO_PICK"
    PICKED_UP = "PICKED_UP"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (
        CheckConstraint(
            "status IN ('PENDING','ACCEPTED','READY_TO_PICK','PICKED_UP','OUT_FOR_DELIVERY','DELIVERED','CANCELLED')",
            name="orders_status_check",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    delivery_boy_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    delivery_address: Mapped[str] = mapped_column(String(500), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus, name="order_status"), nullable=False)
    order_time: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
    payment_method: Mapped[OrderPaymentMethod] = mapped_column(
        Enum(OrderPaymentMethod, name="order_payment_method"), nullable=False
    )

    customer = relationship("User", foreign_keys=[customer_id], back_populates="customer_orders")
    delivery_boy = relationship("User", foreign_keys=[delivery_boy_id], back_populates="delivery_orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
