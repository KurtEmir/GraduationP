from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.domain_models import AlertSeverity

class AlertBase(BaseModel):
    patient_id: int
    message: str
    severity: AlertSeverity
    anomaly_id: Optional[int] = None
    is_resolved: Optional[bool] = False

class AlertCreate(AlertBase):
    pass

class AlertUpdate(BaseModel):
    message: Optional[str] = None
    severity: Optional[AlertSeverity] = None
    is_resolved: Optional[bool] = None

class AlertInDBBase(AlertBase):
    id: int
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Alert(AlertInDBBase):
    """Schema for returning an alert to the client."""
    pass

class AlertList(BaseModel):
    alerts: List[Alert]
    total: int

class MessageBase(BaseModel):
    message: str

class MessageCreate(MessageBase):
    receiver_id: int

class MessageInDBBase(MessageBase):
    id: int
    sender_id: int
    receiver_id: int
    timestamp: datetime
    is_read: bool

    class Config:
        from_attributes = True

class Message(MessageInDBBase):
    pass

class MessageList(BaseModel):
    messages: List[Message]
    total: int 