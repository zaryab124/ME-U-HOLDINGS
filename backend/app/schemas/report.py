from typing import Optional, List, Dict
from pydantic import BaseModel

class SalesOverview(BaseModel):
    total_sales_today: float
    total_sales_week: float
    total_sales_month: float
    total_orders: int
    completed_orders: int
    cancelled_orders: int
    pending_orders: int
    total_cost: float
    total_expenses: float
    gross_profit: float
    net_profit: float
    avg_order_value: float
    best_branch: Optional[str] = None
    best_selling_food: Optional[str] = None
    worst_selling_food: Optional[str] = None
    customer_count: int
    delivery_count: int
    dine_in_count: int
    takeaway_count: int

class DailySalesChartPoint(BaseModel):
    date: str
    sales: float
    orders: int
    profit: float

class BranchSalesComparison(BaseModel):
    branch_id: str
    branch_name: str
    total_sales: float
    total_orders: int
    profit: float

class ProfitLossReport(BaseModel):
    branch_id: Optional[str] = "ALL"
    start_date: str
    end_date: str
    revenue: float
    discounts: float
    refunds: float
    food_costs: float
    operating_expenses: float
    net_profit: float
    profit_margin_percent: float
