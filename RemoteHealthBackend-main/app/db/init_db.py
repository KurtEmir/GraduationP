from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import date, datetime, time
import logging

from app import crud
from app.core.config import settings
# from app.db import base  # noqa: F401
from app.models.user_model import UserRole # Ensure UserRole is imported
from app.models.domain_models import (
    DataSource, 
    DiseaseThresholds, 
    AlertSeverity,
    DoctorNotes,  # Added
    Message as MessageModel, # Added and aliased to avoid Pydantic schema conflict
    Anomaly as AnomalyModel, # Added
    Alert as AlertModel,      # Added
    Vitals as VitalsModel     # Added
)

# Make sure all necessary schemas are imported
from app.schemas.user import UserCreate
from app.schemas.patient import VitalsCreate, PatientProfileCreate
from app.schemas.anomaly import AnomalyCreate
from app.schemas.alert import AlertCreate
from app.schemas.note import NoteCreate
from app.schemas.message import MessageCreate

logger = logging.getLogger(__name__)

def init_db(db: Session) -> None:
    # Create first superuser (Admin)
    admin_user = crud.user.get_by_email(db, email=settings.FIRST_SUPERUSER)
    if not admin_user:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            first_name="Admin",
            last_name="User",
            role=UserRole.ADMIN
        )
        admin_user = crud.user.create(db, obj_in=user_in)
        logger.info(f"FIRST_SUPERUSER created with ID: {admin_user.id} and email: {admin_user.email}")
    else:
        logger.info(f"FIRST_SUPERUSER already exists with ID: {admin_user.id} and email: {admin_user.email}")

    # Create a sample patient user
    patient_email = "patient1@example.com"
    patient_user = crud.user.get_by_email(db, email=patient_email)
    if not patient_user:
        patient_user_in = UserCreate(
            email=patient_email,
            password="patientpassword",
            first_name="John",
            last_name="Doe",
            role=UserRole.PATIENT
        )
        patient_user = crud.user.create(db, obj_in=patient_user_in)

    # Create a patient profile for the sample patient
    patient1_profile = None
    if patient_user:
        patient1_profile = crud.patients.get_by_user_id(db, user_id=patient_user.id)
        if not patient1_profile:
            patient_profile_in = PatientProfileCreate(
                user_id=patient_user.id,
                full_name=f"{patient_user.first_name} {patient_user.last_name}",
                age=30,
                date_of_birth=date(1994, 1, 15),
                gender="Male",
                chronic_diseases="None",
                address="123 Main St, Anytown, USA",
                phone_number="555-0101"
            )
            patient1_profile = crud.patients.create(db, obj_in=patient_profile_in)

    # Add some sample vital signs for the patient
    created_vital_for_anomaly = None
    if patient_user: 
        existing_vitals_count = crud.vitals.count_by_patient(db, patient_id=patient_user.id)
        if existing_vitals_count == 0: 
            vitals_data = [
                VitalsCreate(heart_rate=75, temperature=36.6, spo2=98, source=DataSource.DEVICE.value, systolic=120, diastolic=80, pulse=75),
                VitalsCreate(heart_rate=125, temperature=36.8, spo2=97, source=DataSource.DEVICE.value, systolic=140, diastolic=90, pulse=125), # This one for anomaly
                VitalsCreate(heart_rate=72, temperature=36.5, spo2=99, source=DataSource.MANUAL.value, systolic=118, diastolic=78, pulse=72),
            ]
            for i, vital_in in enumerate(vitals_data):
                created_vital = crud.vitals.create_with_patient(db=db, obj_in=vital_in, patient_id=patient_user.id)
                if i == 1: 
                    created_vital_for_anomaly = created_vital 
            db.commit()
        else:
            potential_anomalous_vital = db.query(VitalsModel).filter(
                VitalsModel.patient_id == patient_user.id,
                VitalsModel.heart_rate == 125
            ).order_by(VitalsModel.timestamp.desc()).first()
            if potential_anomalous_vital:
                created_vital_for_anomaly = potential_anomalous_vital

    # Create a Disease Threshold for Hypertension
    hypertension_threshold = db.query(DiseaseThresholds).filter(DiseaseThresholds.disease == "Hypertension").first()
    if not hypertension_threshold:
        # Create the DiseaseThresholds record using raw SQL to avoid typing issues
        db.execute(text("""
            INSERT INTO disease_thresholds (disease, heart_rate_min, heart_rate_max, temperature_min, temperature_max, spo2_min, spo2_max, created_at)
            VALUES ('Hypertension', 60.0, 120.0, 36.0, 37.5, 95.0, 100.0, CURRENT_TIMESTAMP)
        """))
        db.commit()
        hypertension_threshold = db.query(DiseaseThresholds).filter(DiseaseThresholds.disease == "Hypertension").first()
        
    # Create an Anomaly and Alert if a vital sign is out of range
    if patient_user and created_vital_for_anomaly and hypertension_threshold:
        existing_anomaly = db.query(AnomalyModel).filter_by(vital_id=created_vital_for_anomaly.id).first()
        if not existing_anomaly:
            # Extract actual values from the model instances
            hr_max = 120.0  # Use literal values from the threshold we just created
            hr_min = 60.0
            vital_heart_rate = 125.0  # We know this from the vitals data above
            vital_timestamp = created_vital_for_anomaly.timestamp
            
            # Ensure we have a proper datetime object
            if isinstance(vital_timestamp, date) and not isinstance(vital_timestamp, datetime):
                vital_timestamp_dt = datetime.combine(vital_timestamp, time.min)
            else:
                # If it's already a datetime or None, use it as is
                vital_timestamp_dt = vital_timestamp if isinstance(vital_timestamp, (datetime, type(None))) else datetime.now()
                    
            anomaly_in = AnomalyCreate(
                patient_id=patient_user.id,
                vital_id=created_vital_for_anomaly.id,
                disease="Hypertension",
                threshold_min=hr_min,
                threshold_max=hr_max,
                actual_value=vital_heart_rate,
                timestamp=vital_timestamp_dt
            )
            created_anomaly = crud.anomalies.create(db, obj_in=anomaly_in)
            db.commit() 

            existing_alert = db.query(AlertModel).filter_by(anomaly_id=created_anomaly.id).first()
            if not existing_alert:
                alert_in = AlertCreate(
                    patient_id=patient_user.id,
                    anomaly_id=created_anomaly.id,
                    message=f"High heart rate detected: {vital_heart_rate} bpm.",
                    severity=AlertSeverity.YELLOW 
                )
                crud.alert.create_alert(db, obj_in=alert_in)
                db.commit()
    # Create a Doctor Note
    if admin_user and patient_user:
        existing_note = db.query(DoctorNotes).filter(DoctorNotes.patient_id == patient_user.id, DoctorNotes.doctor_id == admin_user.id).first()
        if not existing_note:
            note_in = NoteCreate(
                patient_id=patient_user.id,
                note="Patient reported feeling well. Regular check-up scheduled."
            )
            crud.notes.add(db, doctor_id=admin_user.id, obj_in=note_in)
            # No need to commit here if crud.notes.add commits, which it does

    # Create a Message
    if admin_user and patient_user:
        existing_message = db.query(MessageModel).filter(
            MessageModel.sender_id == admin_user.id,
            MessageModel.receiver_id == patient_user.id,
            MessageModel.content.like("Hello John, how are you feeling today?%")
        ).first()
        if not existing_message:
            message_in = MessageCreate(
                receiver_id=patient_user.id,
                content="Hello John, how are you feeling today?"
            )
            crud.message.create_message(db, obj_in=message_in, sender_id=admin_user.id)
            # No need to commit here if crud.message.create_message commits

    # ReminderFlags and LocationClusters are not seeded due to lack of Create schemas / clear sample data use case
    # db.commit() # Final commit if any operations above don't commit themselves. Most CRUD ops here do. 