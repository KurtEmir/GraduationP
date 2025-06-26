from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class LocationReport(BaseModel):
    latitude: float
    longitude: float
    risk_level: str
    patient_count: Optional[int] = 0

class LocationCluster(BaseModel):
    id: int
    latitude: float
    longitude: float
    risk_level: str
    patient_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class LocationReportResponse(BaseModel):
    id: int
    latitude: float
    longitude: float
    risk_level: str
    patient_count: int 