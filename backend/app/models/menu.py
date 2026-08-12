from sqlalchemy import Column, String, Float, Boolean, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Category(BaseModel):
    __tablename__ = "categories"

    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    products = relationship("Product", back_populates="category", cascade="all, delete-orphan")

class Product(BaseModel):
    __tablename__ = "products"

    branch_id = Column(UUID(as_uuid=False), ForeignKey("branches.id", ondelete="CASCADE"), nullable=True, index=True)
    category_id = Column(UUID(as_uuid=False), ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, index=True)
    
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    price = Column(Float, nullable=False)
    cost_price = Column(Float, nullable=False, default=0.0)  # For Profit/Loss calculations
    availability = Column(Boolean, default=True)
    preparation_time = Column(Integer, default=15)  # minutes
    featured = Column(Boolean, default=False)

    category = relationship("Category", back_populates="products", lazy="joined")
    branch = relationship("Branch", backref="products", lazy="joined")
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    addons = relationship("ProductAddon", back_populates="product", cascade="all, delete-orphan")

class ProductVariant(BaseModel):
    __tablename__ = "product_variants"

    product_id = Column(UUID(as_uuid=False), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)  # e.g. Small, Large
    price = Column(Float, nullable=False)
    cost_price = Column(Float, nullable=False, default=0.0)

    product = relationship("Product", back_populates="variants")

class ProductAddon(BaseModel):
    __tablename__ = "product_addons"

    product_id = Column(UUID(as_uuid=False), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)  # e.g. Cheese, Extra Sauce
    price = Column(Float, nullable=False)
    cost_price = Column(Float, nullable=False, default=0.0)

    product = relationship("Product", back_populates="addons")
