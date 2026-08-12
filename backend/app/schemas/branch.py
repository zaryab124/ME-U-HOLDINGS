from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class BranchBase(BaseModel):
    name: str
    code: str
    address: str
    city: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone: str
    opening_time: str = "08:00"
    closing_time: str = "23:00"
    status: str = "ACTIVE"
    delivery_enabled: bool = True
    dine_in_enabled: bool = True
    takeaway_enabled: bool = True

class BranchCreate(BranchBase):
    pass

class BranchUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone: Optional[str] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    status: Optional[str] = None
    delivery_enabled: Optional[bool] = None
    dine_in_enabled: Optional[bool] = None
    takeaway_enabled: Optional[bool] = None

class BranchResponse(BranchBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
