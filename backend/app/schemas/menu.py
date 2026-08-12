from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

# --- Category ---
class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    display_order: int = 0
    is_active: bool = True

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Variant ---
class VariantBase(BaseModel):
    name: str
    price: float
    cost_price: float = 0.0

class VariantCreate(VariantBase):
    pass

class VariantResponse(VariantBase):
    id: str
    product_id: str

    class Config:
        from_attributes = True

# --- Addon ---
class AddonBase(BaseModel):
    name: str
    price: float
    cost_price: float = 0.0

class AddonCreate(AddonBase):
    pass

class AddonResponse(AddonBase):
    id: str
    product_id: str

    class Config:
        from_attributes = True

# --- Product ---
class ProductBase(BaseModel):
    branch_id: Optional[str] = None
    category_id: str
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    price: float
    cost_price: float = 0.0
    availability: bool = True
    preparation_time: int = 15
    featured: bool = False

class ProductCreate(ProductBase):
    variants: Optional[List[VariantCreate]] = []
    addons: Optional[List[AddonCreate]] = []

class ProductUpdate(BaseModel):
    category_id: Optional[str] = None
    branch_id: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    price: Optional[float] = None
    cost_price: Optional[float] = None
    availability: Optional[bool] = None
    preparation_time: Optional[int] = None
    featured: Optional[bool] = None

class ProductResponse(ProductBase):
    id: str
    category: Optional[CategoryResponse] = None
    variants: List[VariantResponse] = []
    addons: List[AddonResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
