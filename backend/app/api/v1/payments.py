from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.billing import Payment
from app.models.order import Order
from app.models.user import User
from app.schemas.order import PaymentResponse
from app.websocket.connection_manager import manager

router = APIRouter()

@router.put("/{order_id}/pay", response_model=PaymentResponse)
async def record_payment(
    order_id: str,
    payment_method: str = "CASH",
    transaction_reference: str = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Payment).where(Payment.order_id == order_id))
    payment = result.scalars().first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")

    payment.payment_status = "PAID"
    payment.payment_method = payment_method
    if transaction_reference:
        payment.transaction_reference = transaction_reference

    await db.commit()
    await db.refresh(payment)

    # Fetch order to broadcast
    o_res = await db.execute(select(Order).where(Order.id == order_id))
    order = o_res.scalars().first()
    if order:
        await manager.broadcast_to_branch(order.branch_id, {
            "event": "payment_updated",
            "order_id": order_id,
            "payment_status": "PAID"
        })

    return payment
