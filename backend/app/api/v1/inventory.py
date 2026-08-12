from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.core.deps import require_roles, verify_branch_access, get_current_user
from app.core.roles import UserRole
from app.models.inventory import InventoryItem, InventoryMovement, Expense
from app.models.user import User
from app.schemas.inventory import (
    InventoryItemResponse, InventoryItemCreate, InventoryItemUpdate,
    InventoryMovementCreate, ExpenseResponse, ExpenseCreate
)

router = APIRouter()

@router.get("/items", response_model=List[InventoryItemResponse], dependencies=[require_roles(UserRole.OWNER, UserRole.ADMIN, UserRole.BRANCH_MANAGER)])
async def get_inventory_items(
    branch_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    verify_branch_access(current_user, branch_id)
    result = await db.execute(select(InventoryItem).where(InventoryItem.branch_id == branch_id).order_by(InventoryItem.ingredient))
    items = result.scalars().all()

    response_items = []
    for item in items:
        resp = InventoryItemResponse.model_validate(item)
        resp.is_low_stock = item.quantity <= item.minimum_stock
        response_items.append(resp)

    return response_items

@router.post("/items", response_model=InventoryItemResponse, dependencies=[require_roles(UserRole.OWNER, UserRole.ADMIN, UserRole.BRANCH_MANAGER)])
async def create_inventory_item(
    item_in: InventoryItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    verify_branch_access(current_user, item_in.branch_id)
    item = InventoryItem(**item_in.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    
    resp = InventoryItemResponse.model_validate(item)
    resp.is_low_stock = item.quantity <= item.minimum_stock
    return resp

@router.post("/movements", dependencies=[require_roles(UserRole.OWNER, UserRole.ADMIN, UserRole.BRANCH_MANAGER)])
async def record_inventory_movement(
    movement_in: InventoryMovementCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(InventoryItem).where(InventoryItem.id == movement_in.inventory_item_id))
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    verify_branch_access(current_user, item.branch_id)

    # Adjust stock quantity based on movement type
    if movement_in.movement_type in ["PURCHASE", "RETURN", "ADJUSTMENT"]:
        item.quantity += movement_in.quantity
    elif movement_in.movement_type in ["SALE", "WASTE"]:
        item.quantity -= movement_in.quantity

    movement = InventoryMovement(
        inventory_item_id=item.id,
        user_id=current_user.id,
        movement_type=movement_in.movement_type,
        quantity=movement_in.quantity,
        notes=movement_in.notes
    )
    db.add(movement)
    await db.commit()
    return {"message": "Inventory movement recorded successfully", "new_quantity": item.quantity}

@router.get("/expenses", response_model=List[ExpenseResponse], dependencies=[require_roles(UserRole.OWNER, UserRole.ADMIN, UserRole.BRANCH_MANAGER)])
async def get_expenses(
    branch_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    verify_branch_access(current_user, branch_id)
    result = await db.execute(select(Expense).where(Expense.branch_id == branch_id).order_by(Expense.date.desc()))
    return result.scalars().all()

@router.post("/expenses", response_model=ExpenseResponse, dependencies=[require_roles(UserRole.OWNER, UserRole.ADMIN, UserRole.BRANCH_MANAGER)])
async def create_expense(
    expense_in: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    verify_branch_access(current_user, expense_in.branch_id)
    expense = Expense(**expense_in.model_dump())
    db.add(expense)
    await db.commit()
    await db.refresh(expense)
    return expense
