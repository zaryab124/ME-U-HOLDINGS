from sqlalchemy import Column, String, Float, Boolean, Time
from app.models.base import BaseModel

class Branch(BaseModel):
    __tablename__ = "branches"

    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    address = Column(String(500), nullable=False)
    city = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    phone = Column(String(50), nullable=False)
    opening_time = Column(String(20), default="08:00")
    closing_time = Column(String(20), default="23:00")
    status = Column(String(50), default="ACTIVE")  # ACTIVE, INACTIVE
    delivery_enabled = Column(Boolean, default=True)
    dine_in_enabled = Column(Boolean, default=True)
    takeaway_enabled = Column(Boolean, default=True)
