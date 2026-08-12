from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.audit import Notification
from app.models.user import User

router = APIRouter()

@router.get("/")
async def get_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Notification).where(
        (Notification.user_id == current_user.id) | (Notification.branch_id == current_user.branch_id)
    ).order_by(Notification.created_at.desc())
    res = await db.execute(query)
    notifications = res.scalars().all()
    return [{"id": n.id, "title": n.title, "message": n.message, "is_read": n.is_read, "created_at": n.created_at} for n in notifications]
