from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.models.table import Table
from app.models.branch import Branch
from app.schemas.table import QRScanValidationResponse

router = APIRouter()

@router.get("/validate", response_model=QRScanValidationResponse)
async def validate_qr_token(token: str = Query(...), db: AsyncSession = Depends(get_db)):
    """
    Validates QR code token on the backend to prevent browser-side branch or table tampering.
    """
    result = await db.execute(select(Table).where(Table.qr_code_token == token))
    table = result.scalars().first()
    if not table or not table.active:
        raise HTTPException(status_code=400, detail="Invalid or inactive table QR code")

    b_res = await db.execute(select(Branch).where(Branch.id == table.branch_id))
    branch = b_res.scalars().first()
    if not branch or branch.status != "ACTIVE":
        raise HTTPException(status_code=400, detail="Branch associated with QR code is inactive")

    return {
        "valid": True,
        "branch_id": branch.id,
        "branch_name": branch.name,
        "table_id": table.id,
        "table_number": table.table_number,
        "seats": table.seats
    }
