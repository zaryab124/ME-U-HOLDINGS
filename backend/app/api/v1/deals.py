from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.deps import require_roles
from app.core.roles import UserRole
from app.models.deal import Deal, DealItem
from app.schemas.deal import DealResponse, DealCreate

router = APIRouter()

@router.get("/", response_model=List[DealResponse])
async def get_deals(
    branch_id: Optional[str] = None,
    active_only: bool = True,
    db: AsyncSession = Depends(get_db)
):
    query = select(Deal).options(selectinload(Deal.items))
    if branch_id:
        query = query.where((Deal.branch_id == branch_id) | (Deal.branch_id == None))
    if active_only:
        query = query.where(Deal.active == True)

    result = await db.execute(query.order_by(Deal.created_at.desc()))
    return result.scalars().all()

@router.post("/", response_model=DealResponse, dependencies=[require_roles(UserRole.OWNER, UserRole.ADMIN, UserRole.BRANCH_MANAGER)])
async def create_deal(deal_in: DealCreate, db: AsyncSession = Depends(get_db)):
    data = deal_in.model_dump()
    items_data = data.pop("items", [])

    deal = Deal(**data)
    db.add(deal)
    await db.flush()

    for item in items_data:
        db_item = DealItem(deal_id=deal.id, **item)
        db.add(db_item)

    await db.commit()
    
    query = select(Deal).where(Deal.id == deal.id).options(selectinload(Deal.items))
    res = await db.execute(query)
    return res.scalars().first()
