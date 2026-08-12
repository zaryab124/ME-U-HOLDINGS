from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.core.deps import require_roles, verify_branch_access, get_current_user
from app.core.roles import UserRole
from app.models.table import Table
from app.models.user import User
from app.schemas.table import TableResponse, TableCreate, TableUpdate
from app.utils.qr_generator import generate_qr_token, generate_qr_code_image_base64

router = APIRouter()

@router.get("/", response_model=List[TableResponse])
async def get_tables(
    branch_id: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Table).where(Table.branch_id == branch_id, Table.active == True).order_by(Table.table_number)
    )
    return result.scalars().all()

@router.post("/", response_model=TableResponse, dependencies=[require_roles(UserRole.OWNER, UserRole.ADMIN, UserRole.BRANCH_MANAGER)])
async def create_table(table_in: TableCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    verify_branch_access(current_user, table_in.branch_id)
    
    qr_token = generate_qr_token(table_in.branch_id, table_in.table_number)
    
    table = Table(
        branch_id=table_in.branch_id,
        table_number=table_in.table_number,
        seats=table_in.seats,
        status=table_in.status,
        qr_code_token=qr_token,
        active=table_in.active
    )
    db.add(table)
    await db.commit()
    await db.refresh(table)
    return table

@router.get("/{table_id}/qr-image")
async def get_table_qr_image(table_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Table).where(Table.id == table_id))
    table = result.scalars().first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    qr_base64 = generate_qr_code_image_base64(table.qr_code_token)
    return {"table_id": table.id, "qr_code_token": table.qr_code_token, "qr_image": qr_base64}
