from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class DealItemBase(BaseModel):
    product_id: str
    quantity: int = 1

class DealItemResponse(DealItemBase):
    id: str

    class Config:
        from_attributes = True

class DealBase(BaseModel):
    branch_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    discount_type: str  # PERCENTAGE, FIXED, BOGO, COMBO, CUSTOM
    discount_value: float = 0.0
    minimum_order: float = 0.0
    maximum_discount: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    active: bool = True

class DealCreate(DealBase):
    items: Optional[List[DealItemBase]] = []

class DealResponse(DealBase):
    id: str
    items: List[DealItemResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
