import pytest
from app.models.branch import Branch

@pytest.mark.asyncio
async def test_get_branches_empty_or_populated(async_client, db_session):
    # Add a branch manually to db
    branch = Branch(
        name="Test Main Branch",
        code="BR-TEST-01",
        address="123 Test Street",
        city="TestCity",
        phone="+1-555-0000"
    )
    db_session.add(branch)
    await db_session.commit()

    res = await async_client.get("/api/v1/branches/")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    assert data[0]["code"] == "BR-TEST-01"
