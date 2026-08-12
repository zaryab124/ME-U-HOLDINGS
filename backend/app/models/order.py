from sqlalchemy import Column, String, Float, Integer, ForeignKey, Text, JSON, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Order(BaseModel):
    __tablename__ = "orders"

    order_number = Column(String(50), unique=True, index=True, nullable=False)
    branch_id = Column(UUID(as_uuid=False), ForeignKey("branches.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    table_id = Column(UUID(as_uuid=False), ForeignKey("tables.id", ondelete="SET NULL"), nullable=True, index=True)
    rider_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    order_type = Column(String(50), nullable=False)  # DINE_IN, TAKEAWAY, DELIVERY
    status = Column(String(50), default="PENDING", index=True)  
    # PENDING, CONFIRMED, ACCEPTED, PREPARING, READY, OUT_FOR_DELIVERY, DELIVERED, COMPLETED, CANCELLED

    delivery_status = Column(String(50), nullable=True)
    # WAITING_FOR_RIDER, RIDER_ASSIGNED, PICKED_UP, ON_THE_WAY, DELIVERED

    customer_name = Column(String(255), nullable=False)
    customer_phone = Column(String(50), nullable=False)
    delivery_address = Column(Text, nullable=True)
    delivery_notes = Column(Text, nullable=True)
    special_instructions = Column(Text, nullable=True)

    subtotal = Column(Float, nullable=False, default=0.0)
    discount_amount = Column(Float, nullable=False, default=0.0)
    tax_amount = Column(Float, nullable=False, default=0.0)
    delivery_fee = Column(Float, nullable=False, default=0.0)
    total_amount = Column(Float, nullable=False, default=0.0)
    total_cost = Column(Float, nullable=False, default=0.0)  # Total cost price of ingredients/food for P&L

    preparation_time_minutes = Column(Integer, default=20)
    prepared_at = Column(DateTime(timezone=True), nullable=True)

    branch = relationship("Branch", backref="orders", lazy="joined")
    customer = relationship("User", foreign_keys=[customer_id], backref="customer_orders")
    table = relationship("Table", backref="orders", lazy="joined")
    rider = relationship("User", foreign_keys=[rider_id], backref="rider_deliveries")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    status_history = relationship("OrderStatusHistory", back_populates="order", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="order", uselist=False, cascade="all, delete-orphan")

class OrderItem(BaseModel):
    __tablename__ = "order_items"

    order_id = Column(UUID(as_uuid=False), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(UUID(as_uuid=False), ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    variant_id = Column(UUID(as_uuid=False), ForeignKey("product_variants.id", ondelete="SET NULL"), nullable=True)

    product_name = Column(String(255), nullable=False)
    variant_name = Column(String(100), nullable=True)
    unit_price = Column(Float, nullable=False)
    unit_cost = Column(Float, nullable=False, default=0.0)
    quantity = Column(Integer, nullable=False, default=1)
    addons_json = Column(JSON, nullable=True)  # List of addon dicts
    item_total = Column(Float, nullable=False)
    item_status = Column(String(50), default="PENDING")  # PENDING, PREPARING, PREPARED, SERVED

    order = relationship("Order", back_populates="items")

class OrderStatusHistory(BaseModel):
    __tablename__ = "order_status_history"

    order_id = Column(UUID(as_uuid=False), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    changed_by_user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)

    order = relationship("Order", back_populates="status_history")
    changed_by = relationship("User")
