from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.deps import require_roles, verify_branch_access, get_current_user
from app.core.roles import UserRole
from app.models.order import Order
from app.models.user import User
from app.schemas.order import OrderResponse

router = APIRouter()

@router.get("/display", response_model=List[OrderResponse], dependencies=[require_roles(UserRole.OWNER, UserRole.ADMIN, UserRole.BRANCH_MANAGER, UserRole.KITCHEN_MANAGER, UserRole.KITCHEN_STAFF)])
async def get_kitchen_orders(
    branch_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    verify_branch_access(current_user, branch_id)
    
    # Active kitchen orders (excluding COMPLETED and CANCELLED)
    query = select(Order).where(
        Order.branch_id == branch_id,
        Order.status.in_(["PENDING", "CONFIRMED", "ACCEPTED", "PREPARING", "READY"])
    ).options(
        selectinload(Order.items),
        selectinload(Order.status_history)
    ).order_by(Order.created_at.asc())

    res = await db.execute(query)
    return res.scalars().all()
