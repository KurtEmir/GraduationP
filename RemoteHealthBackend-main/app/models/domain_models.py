from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, Enum, Text, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from .base import Base

class AlertSeverity(str, enum.Enum):
    RED = "red"
    YELLOW = "yellow"
    BLUE = "blue"

class DataSource(str, enum.Enum):
    MANUAL = "manual"
    SIMULATED = "simulated"
    DEVICE = "device"

class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    full_name = Column(String, index=True)
    age = Column(Integer, nullable=True)
    chronic_diseases = Column(Text, nullable=True)

    # New fields
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    phone_number = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="patient_profile")

class Vitals(Base):
    __tablename__ = "vitals"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"))
    heart_rate = Column(Float)
    temperature = Column(Float)
    spo2 = Column(Float)
    systolic = Column(Integer, nullable=True)
    diastolic = Column(Integer, nullable=True)
    pulse = Column(Integer, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    source = Column(Enum(DataSource))

    # Relationships
    patient = relationship("User", back_populates="vitals")

class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"))
    vital_id = Column(Integer, ForeignKey("vitals.id"))
    disease = Column(String)
    threshold_min = Column(Float)
    threshold_max = Column(Float)
    actual_value = Column(Float)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"))
    anomaly_id = Column(Integer, ForeignKey("anomalies.id"))
    severity = Column(Enum(AlertSeverity))
    message = Column(String)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    receiver_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    is_read = Column(Boolean, default=False)

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")

    @property
    def sender_role(self):
        if self.sender:
            return self.sender.role
        return None

    @property
    def receiver_role(self):
        if self.receiver:
            return self.receiver.role
        return None

class DoctorNotes(Base):
    __tablename__ = "doctor_notes"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id"))
    patient_id = Column(Integer, ForeignKey("users.id"))
    note = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    doctor = relationship("User", foreign_keys=[doctor_id], back_populates="doctor_notes")

class ReminderFlag(Base):
    __tablename__ = "reminder_flags"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"))
    last_data_submission = Column(DateTime(timezone=True))
    reminder_sent = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class DiseaseThresholds(Base):
    __tablename__ = "disease_thresholds"

    id = Column(Integer, primary_key=True, index=True)
    disease = Column(String, unique=True)
    heart_rate_min = Column(Float)
    heart_rate_max = Column(Float)
    temperature_min = Column(Float)
    temperature_max = Column(Float)
    spo2_min = Column(Float)
    spo2_max = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class LocationCluster(Base):
    __tablename__ = "location_clusters"

    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    risk_level = Column(Enum(AlertSeverity))
    patient_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now()) 