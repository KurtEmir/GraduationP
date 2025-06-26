from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class AnomalyBase(BaseModel):
    patient_id: int
    vital_id: int
    disease: str
    threshold_min: float
    threshold_max: float
    actual_value: float
    timestamp: Optional[datetime] = None

class AnomalyCreate(AnomalyBase):
    pass

class AnomalyUpdate(BaseModel):
    pass

class Anomaly(AnomalyBase):
    id: int
    class Config:
        from_attributes = True

class AnomalyCheckRequest(BaseModel):
    patient_id: int
    vitals: dict

class AnomalyCheckResponse(BaseModel):
    anomalies: List[Anomaly] 