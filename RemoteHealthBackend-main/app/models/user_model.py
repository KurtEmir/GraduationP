from sqlalchemy import Boolean, Column, Integer, String, DateTime, Enum, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, backref
from .base import Base
import enum
import random
import string

def generate_doctor_code(length: int = 6) -> str:
    return "".join(
        random.choices(string.ascii_uppercase + string.digits, k=length)
    )

class UserRole(str, enum.Enum):
    DOCTOR = "DOCTOR"
    PATIENT = "PATIENT"
    ADMIN = "ADMIN"

# from sqlalchemy.ext.declarative import declared_attr

class User(Base):
    __tablename__: str = "users"  # type: ignore

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    hashed_password = Column(String, nullable=False)
    doctor_code = Column(String, unique=True, index=True, nullable=True)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean(), default=True)
    is_superuser = Column(Boolean(), default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    patient_profile = relationship("PatientProfile", back_populates="user", uselist=False)
    vitals = relationship("Vitals", back_populates="patient")
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    received_messages = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")
    doctor_notes = relationship("DoctorNotes", foreign_keys="[DoctorNotes.doctor_id]", back_populates="doctor")
    
    # Corrected Relationship for Doctor (One) to Patients (Many)
    patients = relationship(
        "User",
        backref=backref("doctor", remote_side=[id]),  # Correctly defines the back-reference
        foreign_keys=[doctor_id]  # Links this relationship via the doctor_id column
    ) 