from sqlalchemy.orm import Session, Query
from typing import Optional, List
from app.crud.base import CRUDBase
from app.models import PatientProfile, User, Alert
from app.models.domain_models import AlertSeverity
from app.schemas.patient import PatientProfileCreate, PatientProfileUpdate
from sqlalchemy import or_

class CRUDPatients(CRUDBase[PatientProfile, PatientProfileCreate, PatientProfileUpdate]):
    def get_by_user_id(self, db: Session, *, user_id: int) -> Optional[PatientProfile]:
        return db.query(self.model).filter(self.model.user_id == user_id).first()

    def get_by_doctor_id(
        self, db: Session, *, doctor_id: int
    ) -> List[PatientProfile]:
        return (
            db.query(self.model).filter(self.model.doctor_id == doctor_id).all()
        )

    def get_multi_filtered(
        self, 
        db: Session, 
        *, 
        skip: int = 0, 
        limit: int = 100,
        name_search: Optional[str] = None,
        chronic_disease_filter: Optional[str] = None,
        alarm_severity_filter: Optional[AlertSeverity] = None,
        doctor_id: Optional[int] = None
    ) -> List[PatientProfile]:
        query: Query = db.query(self.model)

        if doctor_id:
            query = query.join(User, PatientProfile.user_id == User.id).filter(User.doctor_id == doctor_id)

        if name_search:
            query = query.filter(PatientProfile.full_name.ilike(f"%{name_search}%"))

        if chronic_disease_filter:
            query = query.filter(PatientProfile.chronic_diseases.ilike(f"%{chronic_disease_filter}%"))

        if alarm_severity_filter:
            if not any(target.entity is User for target in query._legacy_setup_joins):
                query = query.join(User, PatientProfile.user_id == User.id)
            
            query = (
                query.join(Alert, User.id == Alert.patient_id)
                .filter(Alert.severity == alarm_severity_filter)
                .filter(Alert.is_resolved == False)
            )
        
        query = query.distinct(PatientProfile.id)

        return query.offset(skip).limit(limit).all()

patients = CRUDPatients(PatientProfile) 