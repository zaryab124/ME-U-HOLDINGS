from typing import Optional
from pydantic import BaseModel, EmailStr

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    branch_id: Optional[str] = None
    full_name: str

class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None
    branch_id: Optional[str] = None

class LoginRequest(BaseModel):
    username_or_email: str
    password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str
