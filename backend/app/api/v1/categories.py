from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.core.deps import require_roles
from app.core.roles import UserRole
from app.models.menu import Category
from app.schemas.menu import CategoryResponse, CategoryCreate

router = APIRouter()

@router.get("/", response_model=List[CategoryResponse])
async def get_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category).where(Category.is_active == True).order_by(Category.display_order))
    return result.scalars().all()

@router.post("/", response_model=CategoryResponse, dependencies=[require_roles(UserRole.OWNER, UserRole.ADMIN)])
async def create_category(category_in: CategoryCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Category).where(Category.slug == category_in.slug))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Category slug already exists")
    
    category = Category(**category_in.model_dump())
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category
