from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.deps import require_roles
from app.core.roles import UserRole
from app.models.menu import Product, ProductVariant, ProductAddon
from app.schemas.menu import ProductResponse, ProductCreate, ProductUpdate

router = APIRouter()

@router.get("/", response_model=List[ProductResponse])
async def get_products(
    branch_id: Optional[str] = None,
    category_id: Optional[str] = None,
    featured_only: bool = False,
    available_only: bool = True,
    db: AsyncSession = Depends(get_db)
):
    query = select(Product).options(
        selectinload(Product.category),
        selectinload(Product.variants),
        selectinload(Product.addons)
    )

    if branch_id:
        # Include global products (branch_id is null) OR branch-specific products
        query = query.where((Product.branch_id == branch_id) | (Product.branch_id == None))
    
    if category_id:
        query = query.where(Product.category_id == category_id)

    if featured_only:
        query = query.where(Product.featured == True)

    if available_only:
        query = query.where(Product.availability == True)

    result = await db.execute(query.order_by(Product.name))
    return result.scalars().all()

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product_by_id(product_id: str, db: AsyncSession = Depends(get_db)):
    query = select(Product).where(Product.id == product_id).options(
        selectinload(Product.category),
        selectinload(Product.variants),
        selectinload(Product.addons)
    )
    result = await db.execute(query)
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/", response_model=ProductResponse, dependencies=[require_roles(UserRole.OWNER, UserRole.ADMIN, UserRole.BRANCH_MANAGER)])
async def create_product(product_in: ProductCreate, db: AsyncSession = Depends(get_db)):
    data = product_in.model_dump()
    variants_data = data.pop("variants", [])
    addons_data = data.pop("addons", [])

    product = Product(**data)
    db.add(product)
    await db.flush()

    for v in variants_data:
        variant = ProductVariant(product_id=product.id, **v)
        db.add(variant)

    for a in addons_data:
        addon = ProductAddon(product_id=product.id, **a)
        db.add(addon)

    await db.commit()
    await db.refresh(product)
    
    # Reload relationships
    query = select(Product).where(Product.id == product.id).options(
        selectinload(Product.category),
        selectinload(Product.variants),
        selectinload(Product.addons)
    )
    res = await db.execute(query)
    return res.scalars().first()

@router.put("/{product_id}", response_model=ProductResponse, dependencies=[require_roles(UserRole.OWNER, UserRole.ADMIN, UserRole.BRANCH_MANAGER)])
async def update_product(product_id: str, product_in: ProductUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = product_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    await db.commit()

    query = select(Product).where(Product.id == product.id).options(
        selectinload(Product.category),
        selectinload(Product.variants),
        selectinload(Product.addons)
    )
    res = await db.execute(query)
    return res.scalars().first()
