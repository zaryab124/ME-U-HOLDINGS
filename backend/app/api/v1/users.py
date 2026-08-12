from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.core.roles import UserRole
from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.user import UserResponse, UserCreate, UserUpdate

router = APIRouter()

@router.get("/", response_model=List[UserResponse], dependencies=[require_roles(UserRole.OWNER, UserRole.ADMIN, UserRole.BRANCH_MANAGER)])
async def get_users(
    branch_id: Optional[str] = None,
    role: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(User)
    # Branch isolation for Branch Manager
    if current_user.role == UserRole.BRANCH_MANAGER.value:
        query = query.where(User.branch_id == current_user.branch_id)
    elif branch_id:
        query = query.where(User.branch_id == branch_id)

    if role:
        query = query.where(User.role == role)

    result = await db.execute(query.order_by(User.full_name))
    return result.scalars().all()

@router.post("/", response_model=UserResponse, dependencies=[require_roles(UserRole.OWNER, UserRole.ADMIN)])
async def create_user_by_admin(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where((User.email == user_in.email) | (User.username == user_in.username)))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Username or Email already exists")

    db_user = User(
        email=user_in.email,
        username=user_in.username,
        full_name=user_in.full_name,
        phone=user_in.phone,
        role=user_in.role.value if hasattr(user_in.role, 'value') else user_in.role,
        branch_id=user_in.branch_id,
        hashed_password=get_password_hash(user_in.password),
        is_active=user_in.is_active
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

@router.put("/{user_id}", response_model=UserResponse, dependencies=[require_roles(UserRole.OWNER, UserRole.ADMIN, UserRole.BRANCH_MANAGER)])
async def update_user(user_id: str, user_in: UserUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.role == UserRole.BRANCH_MANAGER.value and str(user.branch_id) != str(current_user.branch_id):
        raise HTTPException(status_code=403, detail="Cannot manage user from another branch")

    update_data = user_in.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    
    for field, value in update_data.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)
    return user
