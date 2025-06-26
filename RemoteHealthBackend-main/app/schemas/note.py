from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NoteBase(BaseModel):
    patient_id: int
    note: str

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    note: Optional[str] = None

class NoteInDBBase(NoteBase):
    id: int
    doctor_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class Note(NoteInDBBase):
    pass 