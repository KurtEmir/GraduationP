from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.user_model import UserRole

# Shared properties
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role: UserRole

# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str
    doctor_code: Optional[str] = None

# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = None
    
class UserInDBBase(UserBase):
    id: int
    is_active: bool
    is_superuser: bool

    class Config:
        orm_mode = True

# Additional properties to return via API
class User(UserInDBBase):
    pass

# Additional properties stored in DB
class UserInDB(UserInDBBase):
    hashed_password: str
    
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[int] = None

class AuthResponse(BaseModel):
    user: User
    token: Token

class DoctorCode(BaseModel):
    doctor_code: str 