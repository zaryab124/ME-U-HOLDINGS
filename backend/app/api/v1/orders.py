import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles, verify_branch_access
from app.core.roles import UserRole
from app.models.branch import Branch
from app.models.menu import Product, ProductVariant
from app.models.table import Table
from app.models.order import Order, OrderItem, OrderStatusHistory
from app.models.billing import Payment
from app.models.deal import Deal
from app.models.user import User
from app.schemas.order import OrderResponse, OrderCreate, OrderStatusUpdate, RiderAssignUpdate
from app.websocket.connection_manager import manager

router = APIRouter()

def generate_order_number() -> str:
    now_str = datetime.now().strftime("%Y%m%d%H%M")
    short_uuid = str(uuid.uuid4())[:4].upper()
    return f"ORD-{now_str}-{short_uuid}"

@router.post("/", response_model=OrderResponse)
async def create_order(order_in: OrderCreate, db: AsyncSession = Depends(get_db)):
    # 1. Fetch & Validate Branch
    b_res = await db.execute(select(Branch).where(Branch.id == order_in.branch_id))
    branch = b_res.scalars().first()
    if not branch or branch.status != "ACTIVE":
        raise HTTPException(status_code=400, detail="Invalid or inactive branch")

    # Delivery availability check
    if order_in.order_type == "DELIVERY" and not branch.delivery_enabled:
        raise HTTPException(status_code=400, detail="Delivery is currently disabled for this branch")

    if order_in.order_type == "DINE_IN" and not branch.dine_in_enabled:
        raise HTTPException(status_code=400, detail="Dine-in is currently disabled for this branch")

    if order_in.order_type == "TAKEAWAY" and not branch.takeaway_enabled:
        raise HTTPException(status_code=400, detail="Takeaway is currently disabled for this branch")

    # Table validation for Dine-in
    table_id = order_in.table_id
    if order_in.order_type == "DINE_IN" and order_in.qr_token:
        tbl_res = await db.execute(select(Table).where(Table.qr_code_token == order_in.qr_token))
        tbl = tbl_res.scalars().first()
        if not tbl or str(tbl.branch_id) != str(branch.id):
            raise HTTPException(status_code=400, detail="Invalid QR code for this branch")
        table_id = tbl.id
        tbl.status = "OCCUPIED"

    # 2. Process Order Items & Server-Side Price Calculations
    subtotal = 0.0
    total_cost = 0.0
    order_items_to_create = []
    max_prep_time = 15

    for item in order_in.items:
        p_res = await db.execute(select(Product).where(Product.id == item.product_id))
        product = p_res.scalars().first()
        if not product or not product.availability:
            raise HTTPException(status_code=400, detail=f"Product {item.product_id} is unavailable")

        unit_price = product.price
        unit_cost = product.cost_price
        variant_name = None

        if item.variant_id:
            v_res = await db.execute(select(ProductVariant).where(ProductVariant.id == item.variant_id))
            variant = v_res.scalars().first()
            if variant:
                unit_price = variant.price
                unit_cost = variant.cost_price
                variant_name = variant.name

        addons_price = 0.0
        addons_list = []
        if item.addons:
            for addon in item.addons:
                addons_price += addon.price
                addons_list.append({"name": addon.name, "price": addon.price})

        item_total = (unit_price + addons_price) * item.quantity
        item_cost = unit_cost * item.quantity

        subtotal += item_total
        total_cost += item_cost
        if product.preparation_time > max_prep_time:
            max_prep_time = product.preparation_time

        order_items_to_create.append({
            "product_id": product.id,
            "variant_id": item.variant_id,
            "product_name": product.name,
            "variant_name": variant_name,
            "unit_price": unit_price,
            "unit_cost": unit_cost,
            "quantity": item.quantity,
            "addons_json": addons_list,
            "item_total": item_total
        })

    # 3. Calculate Discount with Server-Side Limits
    discount_amount = 0.0
    if order_in.deal_id:
        d_res = await db.execute(select(Deal).where(Deal.id == order_in.deal_id, Deal.active == True))
        deal = d_res.scalars().first()
        if deal:
            if deal.discount_type == "PERCENTAGE":
                discount_amount = subtotal * (deal.discount_value / 100.0)
                if deal.maximum_discount:
                    discount_amount = min(discount_amount, deal.maximum_discount)
            elif deal.discount_type == "FIXED":
                discount_amount = min(deal.discount_value, subtotal)
    elif order_in.custom_deal:
        # CUSTOM DEAL DISCOUNT ENFORCEMENT: Max 25% cutoff
        req_pct = order_in.custom_deal.requested_discount_percent
        allowed_pct = min(req_pct, settings.MAX_CUSTOM_DEAL_DISCOUNT)
        discount_amount = subtotal * (allowed_pct / 100.0)

    # 4. Tax & Delivery Fee
    tax_amount = (subtotal - discount_amount) * (settings.DEFAULT_TAX_PERCENTAGE / 100.0)
    delivery_fee = settings.DEFAULT_DELIVERY_FEE if order_in.order_type == "DELIVERY" else 0.0
    total_amount = subtotal - discount_amount + tax_amount + delivery_fee

    order_num = generate_order_number()

    db_order = Order(
        order_number=order_num,
        branch_id=branch.id,
        table_id=table_id,
        order_type=order_in.order_type,
        status="PENDING",
        delivery_status="WAITING_FOR_RIDER" if order_in.order_type == "DELIVERY" else None,
        customer_name=order_in.customer_name,
        customer_phone=order_in.customer_phone,
        delivery_address=order_in.delivery_address,
        delivery_notes=order_in.delivery_notes,
        special_instructions=order_in.special_instructions,
        subtotal=subtotal,
        discount_amount=discount_amount,
        tax_amount=tax_amount,
        delivery_fee=delivery_fee,
        total_amount=total_amount,
        total_cost=total_cost,
        preparation_time_minutes=max_prep_time
    )
    db.add(db_order)
    await db.flush()

    # Create items
    for oi in order_items_to_create:
        db_item = OrderItem(order_id=db_order.id, **oi)
        db.add(db_item)

    # Create Payment record
    db_payment = Payment(
        order_id=db_order.id,
        payment_method=order_in.payment_method,
        payment_status="PENDING",
        amount=total_amount
    )
    db.add(db_payment)

    # Initial status history
    history = OrderStatusHistory(
        order_id=db_order.id,
        previous_status=None,
        new_status="PENDING",
        notes="Order created by customer/cashier"
    )
    db.add(history)

    await db.commit()
    await db.refresh(db_order)

    # Reload relationships for response & websocket broadcast
    query = select(Order).where(Order.id == db_order.id).options(
        selectinload(Order.items),
        selectinload(Order.status_history),
        selectinload(Order.payment)
    )
    res = await db.execute(query)
    full_order = res.scalars().first()

    # Real-time WebSocket broadcast to Kitchen & Branch
    await manager.broadcast_to_branch(branch.id, {
        "event": "new_order",
        "order_id": full_order.id,
        "order_number": full_order.order_number,
        "order_type": full_order.order_type,
        "customer_name": full_order.customer_name,
        "total_amount": full_order.total_amount,
        "created_at": full_order.created_at.isoformat()
    })

    return full_order

@router.get("/", response_model=List[OrderResponse])
async def get_orders(
    branch_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    order_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Order).options(
        selectinload(Order.items),
        selectinload(Order.status_history),
        selectinload(Order.payment)
    )

    if current_user.role not in [UserRole.OWNER.value, UserRole.ADMIN.value]:
        query = query.where(Order.branch_id == current_user.branch_id)
    elif branch_id and branch_id != "ALL":
        query = query.where(Order.branch_id == branch_id)

    if status_filter:
        query = query.where(Order.status == status_filter)

    if order_type:
        query = query.where(Order.order_type == order_type)

    result = await db.execute(query.order_by(Order.created_at.desc()))
    return result.scalars().all()

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order_by_id(order_id: str, db: AsyncSession = Depends(get_db)):
    query = select(Order).where((Order.id == order_id) | (Order.order_number == order_id)).options(
        selectinload(Order.items),
        selectinload(Order.status_history),
        selectinload(Order.payment)
    )
    result = await db.execute(query)
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.put("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: str,
    status_in: OrderStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Order).where(Order.id == order_id).options(
        selectinload(Order.items),
        selectinload(Order.status_history),
        selectinload(Order.payment)
    )
    result = await db.execute(query)
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if current_user.role not in [UserRole.OWNER.value, UserRole.ADMIN.value] and str(current_user.branch_id) != str(order.branch_id):
        raise HTTPException(status_code=403, detail="Cannot update order from another branch")

    prev_status = order.status
    order.status = status_in.status

    if status_in.status == "READY":
        order.prepared_at = datetime.now(timezone.utc)

    # Record status history
    history = OrderStatusHistory(
        order_id=order.id,
        changed_by_user_id=current_user.id,
        previous_status=prev_status,
        new_status=status_in.status,
        notes=status_in.notes
    )
    db.add(history)

    await db.commit()
    await db.refresh(order)

    # Real-time WebSocket notification to branch & customer order tracker
    msg = {
        "event": "order_updated",
        "order_id": order.id,
        "order_number": order.order_number,
        "previous_status": prev_status,
        "new_status": order.status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await manager.broadcast_to_branch(order.branch_id, msg)
    await manager.broadcast_order_update(order.id, msg)

    return order

@router.put("/{order_id}/assign-rider", response_model=OrderResponse, dependencies=[require_roles(UserRole.OWNER, UserRole.ADMIN, UserRole.BRANCH_MANAGER)])
async def assign_rider(
    order_id: str,
    rider_in: RiderAssignUpdate,
    db: AsyncSession = Depends(get_db)
):
    query = select(Order).where(Order.id == order_id).options(
        selectinload(Order.items),
        selectinload(Order.status_history),
        selectinload(Order.payment)
    )
    result = await db.execute(query)
    order = result.scalars().first()
    if not order or order.order_type != "DELIVERY":
        raise HTTPException(status_code=400, detail="Invalid delivery order")

    order.rider_id = rider_in.rider_id
    order.delivery_status = "RIDER_ASSIGNED"
    await db.commit()
    await db.refresh(order)

    await manager.broadcast_to_branch(order.branch_id, {
        "event": "rider_assigned",
        "order_id": order.id,
        "rider_id": rider_in.rider_id
    })

    return order
