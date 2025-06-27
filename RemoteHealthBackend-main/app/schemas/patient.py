from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date
from app.models.user_model import UserRole

class PatientProfileBase(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    chronic_diseases: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    phone_number: Optional[str] = None

class PatientProfileCreate(PatientProfileBase):
    user_id: int
    full_name: str

class PatientProfileUpdate(PatientProfileBase):
    pass

class PatientProfileSelfBase(BaseModel):
    full_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    chronic_diseases: Optional[str] = None
    address: Optional[str] = None
    phone_number: Optional[str] = None
    age: Optional[int] = Field(None, description="Age can be calculated from date_of_birth if provided, or set directly.")

class PatientProfileSelfCreateSchema(PatientProfileSelfBase):
    pass

class PatientProfileSelfUpdateSchema(PatientProfileSelfBase):
    pass

class PatientProfileInDBBase(PatientProfileBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PatientProfile(PatientProfileInDBBase):
    pass

class PatientDataResponse(BaseModel):
    id: Optional[int] = Field(None, description="PatientProfile ID")
    user_id: int = Field(..., description="User ID from users table")
    email: EmailStr
    role: UserRole
    full_name: Optional[str] = None
    age: Optional[int] = None
    chronic_diseases: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    phone_number: Optional[str] = None
    risk_score: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class VitalsBase(BaseModel):
    heart_rate: float = Field(..., alias='heartRate')
    temperature: float
    spo2: float = Field(..., alias='oxygenSaturation')
    source: str
    systolic: Optional[int] = None
    diastolic: Optional[int] = None
    pulse: Optional[int] = None

class VitalsCreate(VitalsBase):
    pass

class VitalsUpdate(BaseModel):
    heart_rate: Optional[float] = Field(None, alias='heartRate')
    temperature: Optional[float] = None
    spo2: Optional[float] = Field(None, alias='oxygenSaturation')
    source: Optional[str] = None
    systolic: Optional[int] = None
    diastolic: Optional[int] = None
    pulse: Optional[int] = None

class VitalsInDBBase(VitalsBase):
    id: int
    patient_id: int = Field(..., alias='patientId')
    timestamp: datetime

    class Config:
        from_attributes = True
        populate_by_name = True

class Vitals(VitalsInDBBase):
    pass

class VitalsList(BaseModel):
    vitals: List[Vitals]
    total: int

# New Schemas for Vital Sign Statistics
class VitalSignStat(BaseModel):
    month: str
    count: int

class VitalSignsStatsResponse(BaseModel):
    data: List[VitalSignStat] 