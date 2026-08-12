import pytest
from app.models.user import User
from app.models.branch import Branch
from app.core.security import get_password_hash
from app.core.roles import UserRole

@pytest.mark.asyncio
async def test_register_and_login_user(async_client, db_session):
    # 1. Register
    reg_payload = {
        "email": "testuser@gmail.com",
        "username": "testuser",
        "full_name": "Test User",
        "password": "Password123!",
        "role": "CUSTOMER"
    }
    response = await async_client.post("/api/v1/auth/register", json=reg_payload)
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["email"] == "testuser@gmail.com"
    assert data["role"] == "CUSTOMER"

    # 2. Login
    login_payload = {
        "username_or_email": "testuser",
        "password": "Password123!"
    }
    login_res = await async_client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200, login_res.text
    login_data = login_res.json()
    assert "access_token" in login_data
    assert "refresh_token" in login_data
    assert login_data["role"] == "CUSTOMER"

@pytest.mark.asyncio
async def test_invalid_login(async_client):
    login_payload = {
        "username_or_email": "nonexistent",
        "password": "wrongpassword"
    }
    res = await async_client.post("/api/v1/auth/login", json=login_payload)
    assert res.status_code == 401
