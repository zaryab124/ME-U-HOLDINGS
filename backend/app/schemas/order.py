from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel

class AddonSelection(BaseModel):
    name: str
    price: float

class OrderItemCreate(BaseModel):
    product_id: str
    variant_id: Optional[str] = None
    quantity: int = 1
    addons: Optional[List[AddonSelection]] = []
    special_instructions: Optional[str] = None

class CustomDealItemSelection(BaseModel):
    product_id: str
    quantity: int = 1

class CustomDealOrderCreate(BaseModel):
    items: List[CustomDealItemSelection]
    requested_discount_percent: float

class OrderCreate(BaseModel):
    branch_id: str
    order_type: str  # DINE_IN, TAKEAWAY, DELIVERY
    table_id: Optional[str] = None
    qr_token: Optional[str] = None  # Validated server-side if dine-in
    customer_name: str
    customer_phone: str
    delivery_address: Optional[str] = None
    delivery_notes: Optional[str] = None
    special_instructions: Optional[str] = None
    deal_id: Optional[str] = None
    custom_deal: Optional[CustomDealOrderCreate] = None
    items: List[OrderItemCreate]
    payment_method: str = "CASH"  # CASH, CARD, ONLINE

class OrderStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None

class RiderAssignUpdate(BaseModel):
    rider_id: str

class OrderItemResponse(BaseModel):
    id: str
    product_id: Optional[str]
    product_name: str
    variant_name: Optional[str]
    unit_price: float
    quantity: int
    addons_json: Optional[Any]
    item_total: float
    item_status: str

    class Config:
        from_attributes = True

class OrderStatusHistoryResponse(BaseModel):
    id: str
    previous_status: Optional[str]
    new_status: str
    changed_by_user_id: Optional[str]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class PaymentResponse(BaseModel):
    id: str
    payment_method: str
    payment_status: str
    amount: float
    transaction_reference: Optional[str]

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: str
    order_number: str
    branch_id: str
    customer_id: Optional[str]
    table_id: Optional[str]
    rider_id: Optional[str]
    order_type: str
    status: str
    delivery_status: Optional[str]
    customer_name: str
    customer_phone: str
    delivery_address: Optional[str]
    delivery_notes: Optional[str]
    special_instructions: Optional[str]
    subtotal: float
    discount_amount: float
    tax_amount: float
    delivery_fee: float
    total_amount: float
    preparation_time_minutes: int
    prepared_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []
    status_history: List[OrderStatusHistoryResponse] = []
    payment: Optional[PaymentResponse] = None

    class Config:
        from_attributes = True
