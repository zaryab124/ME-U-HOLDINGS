from sqlalchemy import Column, String, Float, Boolean, ForeignKey, DateTime, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Deal(BaseModel):
    __tablename__ = "deals"

    branch_id = Column(UUID(as_uuid=False), ForeignKey("branches.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    discount_type = Column(String(50), nullable=False)  # PERCENTAGE, FIXED, BOGO, COMBO, CUSTOM
    discount_value = Column(Float, nullable=False, default=0.0)
    minimum_order = Column(Float, default=0.0)
    maximum_discount = Column(Float, nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    active = Column(Boolean, default=True)

    branch = relationship("Branch", backref="deals", lazy="joined")
    items = relationship("DealItem", back_populates="deal", cascade="all, delete-orphan")

class DealItem(BaseModel):
    __tablename__ = "deal_items"

    deal_id = Column(UUID(as_uuid=False), ForeignKey("deals.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(UUID(as_uuid=False), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity = Column(Integer, default=1)

    deal = relationship("Deal", back_populates="items")
    product = relationship("Product", lazy="joined")
