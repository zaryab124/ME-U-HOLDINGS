from sqlalchemy import Column, String, Integer, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Table(BaseModel):
    __tablename__ = "tables"

    branch_id = Column(UUID(as_uuid=False), ForeignKey("branches.id", ondelete="CASCADE"), nullable=False, index=True)
    table_number = Column(String(50), nullable=False)
    seats = Column(Integer, default=4)
    status = Column(String(50), default="AVAILABLE")  # AVAILABLE, OCCUPIED, RESERVED, OUT_OF_SERVICE
    qr_code_token = Column(String(255), unique=True, index=True, nullable=False)
    active = Column(Boolean, default=True)

    branch = relationship("Branch", backref="tables", lazy="joined")
