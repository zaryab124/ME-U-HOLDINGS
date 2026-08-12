from sqlalchemy import Column, String, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Feedback(BaseModel):
    __tablename__ = "feedback"

    branch_id = Column(UUID(as_uuid=False), ForeignKey("branches.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id = Column(UUID(as_uuid=False), ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True)
    customer_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    rating = Column(Integer, nullable=False)  # 1-5 overall
    food_rating = Column(Integer, nullable=True)  # 1-5
    service_rating = Column(Integer, nullable=True)  # 1-5
    delivery_rating = Column(Integer, nullable=True)  # 1-5
    written_feedback = Column(Text, nullable=True)

    branch = relationship("Branch", backref="feedbacks", lazy="joined")
    order = relationship("Order")
    customer = relationship("User")
