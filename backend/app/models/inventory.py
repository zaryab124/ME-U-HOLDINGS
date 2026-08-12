from sqlalchemy import Column, String, Float, ForeignKey, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class InventoryItem(BaseModel):
    __tablename__ = "inventory_items"

    branch_id = Column(UUID(as_uuid=False), ForeignKey("branches.id", ondelete="CASCADE"), nullable=False, index=True)
    ingredient = Column(String(255), nullable=False)
    quantity = Column(Float, nullable=False, default=0.0)
    unit = Column(String(50), nullable=False, default="kg")  # kg, grams, liters, pcs, packs
    minimum_stock = Column(Float, nullable=False, default=10.0)
    cost_per_unit = Column(Float, nullable=False, default=0.0)

    branch = relationship("Branch", backref="inventory_items", lazy="joined")
    movements = relationship("InventoryMovement", back_populates="inventory_item", cascade="all, delete-orphan")

class InventoryMovement(BaseModel):
    __tablename__ = "inventory_movements"

    inventory_item_id = Column(UUID(as_uuid=False), ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    movement_type = Column(String(50), nullable=False)  # PURCHASE, SALE, WASTE, ADJUSTMENT, RETURN
    quantity = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)

    inventory_item = relationship("InventoryItem", back_populates="movements")
    user = relationship("User")

class Expense(BaseModel):
    __tablename__ = "expenses"

    branch_id = Column(UUID(as_uuid=False), ForeignKey("branches.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(100), nullable=False)  # Rent, Utilities, Salaries, Maintenance, Packaging, Other
    amount = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    date = Column(DateTime(timezone=True), nullable=False)

    branch = relationship("Branch", backref="expenses", lazy="joined")
