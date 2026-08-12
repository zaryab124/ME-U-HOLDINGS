from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.deps import require_roles, get_current_user
from app.core.roles import UserRole
from app.models.order import Order
from app.models.user import User
from app.schemas.order import OrderResponse
from app.websocket.connection_manager import manager

router = APIRouter()

@router.get("/assigned", response_model=List[OrderResponse], dependencies=[require_roles(UserRole.RIDER)])
async def get_rider_assigned_deliveries(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Order).where(
        Order.rider_id == current_user.id,
        Order.delivery_status.in_(["RIDER_ASSIGNED", "PICKED_UP", "ON_THE_WAY"])
    ).options(
        selectinload(Order.items),
        selectinload(Order.status_history)
    ).order_by(Order.created_at.desc())

    res = await db.execute(query)
    return res.scalars().all()

@router.put("/{order_id}/status", response_model=OrderResponse, dependencies=[require_roles(UserRole.RIDER, UserRole.BRANCH_MANAGER, UserRole.ADMIN, UserRole.OWNER)])
async def update_delivery_status(
    order_id: str,
    delivery_status: str,  # PICKED_UP, ON_THE_WAY, DELIVERED
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Order).where(Order.id == order_id).options(
        selectinload(Order.items),
        selectinload(Order.status_history)
    )
    res = await db.execute(query)
    order = res.scalars().first()
    if not order or order.order_type != "DELIVERY":
        raise HTTPException(status_code=400, detail="Invalid delivery order")

    order.delivery_status = delivery_status
    if delivery_status == "DELIVERED":
        order.status = "COMPLETED"

    await db.commit()
    await db.refresh(order)

    msg = {
        "event": "delivery_status_updated",
        "order_id": order.id,
        "delivery_status": delivery_status,
        "status": order.status
    }
    await manager.broadcast_to_branch(order.branch_id, msg)
    await manager.broadcast_order_update(order.id, msg)

    return order
