import pytest
from app.models.branch import Branch
from app.models.menu import Category, Product

@pytest.mark.asyncio
async def test_order_creation_and_discount_cap(async_client, db_session):
    # 1. Create Branch & Product
    branch = Branch(name="Test Order Branch", code="BR-ORD-01", address="123 St", city="City", phone="+1-555-1111")
    category = Category(name="Test Cat", slug="test-cat")
    db_session.add(branch)
    db_session.add(category)
    await db_session.flush()

    product = Product(category_id=category.id, name="Test Burger", price=10.00, cost_price=4.00, availability=True)
    db_session.add(product)
    await db_session.commit()

    # 2. Place Order with Custom Deal (Request 50% discount -> capped at 25% server-side)
    order_payload = {
        "branch_id": branch.id,
        "order_type": "TAKEAWAY",
        "customer_name": "John Doe",
        "customer_phone": "+1-555-2222",
        "custom_deal": {
            "items": [{"product_id": product.id, "quantity": 2}],
            "requested_discount_percent": 50.0  # Should be capped at 25%
        },
        "items": [
            {"product_id": product.id, "quantity": 2}
        ],
        "payment_method": "CASH"
    }

    res = await async_client.post("/api/v1/orders/", json=order_payload)
    assert res.status_code == 200, res.text
    data = res.json()

    # Subtotal = $20.00
    # Discount (25% cap of 20.00) = $5.00
    # Tax (5% of 15.00) = $0.75
    # Total = $15.75
    assert data["subtotal"] == 20.00
    assert data["discount_amount"] == 5.00
    assert data["tax_amount"] == 0.75
    assert data["total_amount"] == 15.75
    assert data["status"] == "PENDING"
