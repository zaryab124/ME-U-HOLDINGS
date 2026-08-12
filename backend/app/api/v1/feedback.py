from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.core.roles import UserRole
from app.models.feedback import Feedback
from app.models.user import User
from app.schemas.feedback import FeedbackResponse, FeedbackCreate, FeedbackAnalytics

router = APIRouter()

@router.post("/", response_model=FeedbackResponse)
async def submit_feedback(
    feedback_in: FeedbackCreate,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    customer_id = current_user.id if current_user else None
    feedback = Feedback(
        branch_id=feedback_in.branch_id,
        order_id=feedback_in.order_id,
        customer_id=customer_id,
        rating=feedback_in.rating,
        food_rating=feedback_in.food_rating,
        service_rating=feedback_in.service_rating,
        delivery_rating=feedback_in.delivery_rating,
        written_feedback=feedback_in.written_feedback
    )
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)
    return feedback

@router.get("/analytics", response_model=FeedbackAnalytics, dependencies=[require_roles(UserRole.OWNER, UserRole.ADMIN, UserRole.BRANCH_MANAGER)])
async def get_feedback_analytics(
    branch_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Feedback Analytics Engine:
    Categorizes ratings, computes weighted averages, and extracts complaint patterns.
    """
    query = select(Feedback)
    if branch_id and branch_id != "ALL":
        query = query.where(Feedback.branch_id == branch_id)

    result = await db.execute(query)
    feedbacks = result.scalars().all()

    if not feedbacks:
        return FeedbackAnalytics(
            total_reviews=0,
            average_rating=0.0,
            average_food_rating=0.0,
            average_service_rating=0.0,
            average_delivery_rating=0.0,
            positive_count=0,
            negative_count=0,
            neutral_count=0,
            common_complaints=[],
            food_complaints_count=0,
            service_complaints_count=0,
            delivery_complaints_count=0
        )

    total = len(feedbacks)
    avg_overall = sum(f.rating for f in feedbacks) / total
    
    food_ratings = [f.food_rating for f in feedbacks if f.food_rating is not None]
    avg_food = sum(food_ratings) / len(food_ratings) if food_ratings else 0.0

    service_ratings = [f.service_rating for f in feedbacks if f.service_rating is not None]
    avg_service = sum(service_ratings) / len(service_ratings) if service_ratings else 0.0

    delivery_ratings = [f.delivery_rating for f in feedbacks if f.delivery_rating is not None]
    avg_delivery = sum(delivery_ratings) / len(delivery_ratings) if delivery_ratings else 0.0

    positive = sum(1 for f in feedbacks if f.rating >= 4)
    negative = sum(1 for f in feedbacks if f.rating <= 2)
    neutral = total - (positive + negative)

    # Basic text pattern extraction for complaints engine
    complaints = []
    food_complaints = 0
    service_complaints = 0
    delivery_complaints = 0

    for f in feedbacks:
        if f.written_feedback:
            text = f.written_feedback.lower()
            if any(w in text for w in ["cold", "salty", "taste", "undercooked", "raw", "small portion"]):
                food_complaints += 1
                complaints.append(f"Food quality issue: '{f.written_feedback[:60]}...'")
            if any(w in text for w in ["slow", "rude", "waiter", "attitude", "table"]):
                service_complaints += 1
                complaints.append(f"Service delay/attitude: '{f.written_feedback[:60]}...'")
            if any(w in text for w in ["late", "cold food", "rider", "address", "missing item"]):
                delivery_complaints += 1
                complaints.append(f"Delivery delay/issue: '{f.written_feedback[:60]}...'")

    return FeedbackAnalytics(
        total_reviews=total,
        average_rating=round(avg_overall, 2),
        average_food_rating=round(avg_food, 2),
        average_service_rating=round(avg_service, 2),
        average_delivery_rating=round(avg_delivery, 2),
        positive_count=positive,
        negative_count=negative,
        neutral_count=neutral,
        common_complaints=complaints[:10],
        food_complaints_count=food_complaints,
        service_complaints_count=service_complaints,
        delivery_complaints_count=delivery_complaints
    )
