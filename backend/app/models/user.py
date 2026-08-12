from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class User(BaseModel):
    __tablename__ = "users"

    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    role = Column(String(50), nullable=False, index=True)  # UserRole enum value
    branch_id = Column(UUID(as_uuid=False), ForeignKey("branches.id", ondelete="SET NULL"), nullable=True, index=True)
    is_active = Column(Boolean, default=True)

    branch = relationship("Branch", backref="users", lazy="joined")
