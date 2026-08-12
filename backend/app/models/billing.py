from sqlalchemy import Column, String, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Payment(BaseModel):
    __tablename__ = "payments"

    order_id = Column(UUID(as_uuid=False), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    payment_method = Column(String(50), nullable=False)  # CASH, CARD, ONLINE, OTHER
    payment_status = Column(String(50), default="PENDING", index=True)  # PENDING, PAID, FAILED, REFUNDED
    amount = Column(Float, nullable=False)
    transaction_reference = Column(String(255), nullable=True)

    order = relationship("Order", back_populates="payment")
