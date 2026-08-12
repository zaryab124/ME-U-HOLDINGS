from typing import List, Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
import csv
import io

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.core.roles import UserRole
from app.models.order import Order, OrderItem
from app.models.branch import Branch
from app.models.inventory import Expense
from app.models.user import User
from app.schemas.report import SalesOverview, ProfitLossReport, DailySalesChartPoint, BranchSalesComparison

router = APIRouter()

@router.get("/sales-overview", response_model=SalesOverview, dependencies=[require_roles(UserRole.OWNER, UserRole.ADMIN, UserRole.BRANCH_MANAGER)])
async def get_sales_overview(
    branch_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role not in [UserRole.OWNER.value, UserRole.ADMIN.value]:
        branch_id = current_user.branch_id

    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    week_start = today_start - timedelta(days=7)
    month_start = today_start - timedelta(days=30)

    base_query = select(Order)
    if branch_id and branch_id != "ALL":
        base_query = base_query.where(Order.branch_id == branch_id)

    res = await db.execute(base_query)
    orders = res.scalars().all()

    completed = [o for o in orders if o.status == "COMPLETED"]
    cancelled = [o for o in orders if o.status == "CANCELLED"]
    pending = [o for o in orders if o.status not in ["COMPLETED", "CANCELLED"]]

    sales_today = sum(o.total_amount for o in completed if o.created_at >= today_start)
    sales_week = sum(o.total_amount for o in completed if o.created_at >= week_start)
    sales_month = sum(o.total_amount for o in completed if o.created_at >= month_start)

    total_cost = sum(o.total_cost for o in completed)

    # Expenses query
    exp_query = select(Expense)
    if branch_id and branch_id != "ALL":
        exp_query = exp_query.where(Expense.branch_id == branch_id)
    exp_res = await db.execute(exp_query)
    expenses = exp_res.scalars().all()
    total_expenses = sum(e.amount for e in expenses)

    gross_profit = sum(o.total_amount for o in completed) - total_cost
    net_profit = gross_profit - total_expenses

    avg_order = (sum(o.total_amount for o in completed) / len(completed)) if completed else 0.0

    delivery_cnt = sum(1 for o in orders if o.order_type == "DELIVERY")
    dine_in_cnt = sum(1 for o in orders if o.order_type == "DINE_IN")
    takeaway_cnt = sum(1 for o in orders if o.order_type == "TAKEAWAY")

    # Find best selling food item
    item_counts = {}
    for o in completed:
        for item in o.items:
            item_counts[item.product_name] = item_counts.get(item.product_name, 0) + item.quantity

    best_food = max(item_counts, key=item_counts.get) if item_counts else "N/A"
    worst_food = min(item_counts, key=item_counts.get) if item_counts else "N/A"

    return SalesOverview(
        total_sales_today=round(sales_today, 2),
        total_sales_week=round(sales_week, 2),
        total_sales_month=round(sales_month, 2),
        total_orders=len(orders),
        completed_orders=len(completed),
        cancelled_orders=len(cancelled),
        pending_orders=len(pending),
        total_cost=round(total_cost, 2),
        total_expenses=round(total_expenses, 2),
        gross_profit=round(gross_profit, 2),
        net_profit=round(net_profit, 2),
        avg_order_value=round(avg_order, 2),
        best_branch="Main Branch",
        best_selling_food=best_food,
        worst_selling_food=worst_food,
        customer_count=len(set(o.customer_name for o in orders)),
        delivery_count=delivery_cnt,
        dine_in_count=dine_in_cnt,
        takeaway_count=takeaway_cnt
    )

@router.get("/export/csv", dependencies=[require_roles(UserRole.OWNER, UserRole.ADMIN, UserRole.BRANCH_MANAGER)])
async def export_sales_csv(
    branch_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Order)
    if branch_id and branch_id != "ALL":
        query = query.where(Order.branch_id == branch_id)

    res = await db.execute(query.order_by(Order.created_at.desc()))
    orders = res.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Order Number", "Date", "Order Type", "Status",
        "Customer Name", "Phone", "Subtotal", "Discount",
        "Tax", "Delivery Fee", "Total Amount", "Cost"
    ])

    for o in orders:
        writer.writerow([
            o.order_number, o.created_at.strftime("%Y-%m-%d %H:%M"),
            o.order_type, o.status, o.customer_name, o.customer_phone,
            o.subtotal, o.discount_amount, o.tax_amount, o.delivery_fee,
            o.total_amount, o.total_cost
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sales_report.csv"}
    )
