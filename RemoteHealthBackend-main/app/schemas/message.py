from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.schemas.user import User  # Assuming User schema can be used or adapted
from app.models.user_model import UserRole # For UserRole enum

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    receiver_id: int

class Message(MessageBase):
    id: int
    sender_id: int
    receiver_id: int
    timestamp: datetime
    is_read: bool
    sender_role: Optional[UserRole] = None
    receiver_role: Optional[UserRole] = None

    class Config:
        from_attributes = True

class ChatPartner(BaseModel):
    id: int
    name: str # This will be combined first_name and last_name
    role: UserRole
    last_message: Optional[str] = None
    last_message_timestamp: Optional[datetime] = None
    unread_count: Optional[int] = 0

    class Config:
        from_attributes = True

class MessageInDB(Message):
    pass 