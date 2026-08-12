from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.core.roles import UserRole
from app.models.branch import Branch
from app.models.user import User
from app.schemas.branch import BranchResponse, BranchCreate, BranchUpdate

router = APIRouter()

@router.get("/", response_model=List[BranchResponse])
async def get_branches(
    city: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Branch)
    if city:
        query = query.where(Branch.city.ilike(f"%{city}%"))
    if status_filter:
        query = query.where(Branch.status == status_filter)
    result = await db.execute(query.order_by(Branch.name))
    return result.scalars().all()

@router.get("/{branch_id}", response_model=BranchResponse)
async def get_branch_by_id(branch_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Branch).where(Branch.id == branch_id))
    branch = result.scalars().first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    return branch

@router.post("/", response_model=BranchResponse, dependencies=[require_roles(UserRole.OWNER, UserRole.ADMIN)])
async def create_branch(branch_in: BranchCreate, db: AsyncSession = Depends(get_db)):
    # Check code unique
    existing = await db.execute(select(Branch).where(Branch.code == branch_in.code))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Branch code already exists")
    
    branch = Branch(**branch_in.model_dump())
    db.add(branch)
    await db.commit()
    await db.refresh(branch)
    return branch

@router.put("/{branch_id}", response_model=BranchResponse, dependencies=[require_roles(UserRole.OWNER, UserRole.ADMIN, UserRole.BRANCH_MANAGER)])
async def update_branch(branch_id: str, branch_in: BranchUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user.role == UserRole.BRANCH_MANAGER.value and str(current_user.branch_id) != str(branch_id):
        raise HTTPException(status_code=403, detail="Cannot edit another branch")

    result = await db.execute(select(Branch).where(Branch.id == branch_id))
    branch = result.scalars().first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    update_data = branch_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(branch, field, value)

    await db.commit()
    await db.refresh(branch)
    return branch
