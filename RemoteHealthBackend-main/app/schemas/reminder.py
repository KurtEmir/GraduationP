from pydantic import BaseModel

class ReminderCheckResponse(BaseModel):
    missing: bool 