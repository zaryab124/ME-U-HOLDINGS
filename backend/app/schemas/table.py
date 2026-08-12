from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class TableBase(BaseModel):
    branch_id: str
    table_number: str
    seats: int = 4
    status: str = "AVAILABLE"  # AVAILABLE, OCCUPIED, RESERVED, OUT_OF_SERVICE
    active: bool = True

class TableCreate(TableBase):
    pass

class TableUpdate(BaseModel):
    table_number: Optional[str] = None
    seats: Optional[int] = None
    status: Optional[str] = None
    active: Optional[bool] = None

class TableResponse(TableBase):
    id: str
    qr_code_token: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class QRScanValidationResponse(BaseModel):
    valid: bool
    branch_id: str
    branch_name: str
    table_id: str
    table_number: str
    seats: int
