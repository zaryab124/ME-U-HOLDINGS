from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class FeedbackCreate(BaseModel):
    branch_id: str
    order_id: Optional[str] = None
    rating: int  # 1-5
    food_rating: Optional[int] = None
    service_rating: Optional[int] = None
    delivery_rating: Optional[int] = None
    written_feedback: Optional[str] = None

class FeedbackResponse(FeedbackCreate):
    id: str
    customer_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class FeedbackAnalytics(BaseModel):
    total_reviews: int
    average_rating: float
    average_food_rating: float
    average_service_rating: float
    average_delivery_rating: float
    positive_count: int  # 4-5 stars
    negative_count: int  # 1-2 stars
    neutral_count: int   # 3 stars
    common_complaints: List[str] = []
    food_complaints_count: int = 0
    service_complaints_count: int = 0
    delivery_complaints_count: int = 0
