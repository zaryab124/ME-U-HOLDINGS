from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class InventoryItemBase(BaseModel):
    branch_id: str
    ingredient: str
    quantity: float = 0.0
    unit: str = "kg"
    minimum_stock: float = 10.0
    cost_per_unit: float = 0.0

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemUpdate(BaseModel):
    ingredient: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    minimum_stock: Optional[float] = None
    cost_per_unit: Optional[float] = None

class InventoryItemResponse(InventoryItemBase):
    id: str
    is_low_stock: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class InventoryMovementCreate(BaseModel):
    inventory_item_id: str
    movement_type: str  # PURCHASE, SALE, WASTE, ADJUSTMENT, RETURN
    quantity: float
    notes: Optional[str] = None

class ExpenseCreate(BaseModel):
    branch_id: str
    category: str
    amount: float
    description: Optional[str] = None
    date: datetime

class ExpenseResponse(ExpenseCreate):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
