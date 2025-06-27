from typing import List, Optional
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.domain_models import Vitals, DiseaseThresholds, AlertSeverity
from app.schemas.patient import VitalsCreate, VitalsUpdate, Vitals as VitalsSchema
from app import crud, schemas
import logging

logger = logging.getLogger(__name__)

class CRUDVitals(CRUDBase[Vitals, VitalsCreate, VitalsUpdate]):
    def get_vitals_by_patient_id(self, db: Session, *, patient_id: int, skip: int = 0, limit: int = 100) -> List[VitalsSchema]:
        return (
            db.query(self.model)
            .filter(self.model.patient_id == patient_id)
            .order_by(self.model.timestamp.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create_with_patient(
        self, db: Session, *, obj_in: VitalsCreate, patient_id: int
    ) -> Vitals:
        obj_in_data = obj_in.model_dump()
        db_obj = self.model(**obj_in_data, patient_id=patient_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def create_and_check(self, db: Session, *, obj_in: VitalsCreate, patient_id: int) -> Vitals:
        """
        Creates a new vital sign record and then immediately checks for anomalies,
        creating alerts if necessary.
        """
        vital = self.create_with_patient(db=db, obj_in=obj_in, patient_id=patient_id)
        logger.info(f"Created vital record with id: {vital.id} for patient_id: {patient_id}")

        thresholds = db.query(DiseaseThresholds).first()
        if not thresholds:
            logger.warning(f"No disease thresholds found in the database. Skipping anomaly check for vital {vital.id}.")
            return vital

        logger.info(f"Using thresholds for '{thresholds.disease}' to check vital {vital.id}.")
        detected_anomalies = []

        if vital.heart_rate and (vital.heart_rate < thresholds.heart_rate_min or vital.heart_rate > thresholds.heart_rate_max):
            anomaly = self._create_anomaly(db, vital, "Cardiovascular", thresholds.heart_rate_min, thresholds.heart_rate_max, vital.heart_rate)
            detected_anomalies.append(anomaly)

        if vital.temperature and (vital.temperature < thresholds.temperature_min or vital.temperature > thresholds.temperature_max):
            anomaly = self._create_anomaly(db, vital, "Systemic", thresholds.temperature_min, thresholds.temperature_max, vital.temperature)
            detected_anomalies.append(anomaly)
            
        if vital.spo2 and (vital.spo2 < thresholds.spo2_min or vital.spo2 > thresholds.spo2_max):
            anomaly = self._create_anomaly(db, vital, "Respiratory", thresholds.spo2_min, thresholds.spo2_max, vital.spo2)
            detected_anomalies.append(anomaly)

        for anomaly in detected_anomalies:
            self._create_alert(db, anomaly)
        
        return vital

    def _create_anomaly(self, db: Session, vital: Vitals, disease: str, min_val: float, max_val: float, actual: float) -> schemas.anomaly.Anomaly:
        logger.info(f"Anomaly detected for patient {vital.patient_id}: {disease} value {actual} is outside range ({min_val} - {max_val}).")
        anomaly_in = schemas.anomaly.AnomalyCreate(
            patient_id=vital.patient_id,
            vital_id=vital.id,
            disease=disease,
            threshold_min=min_val,
            threshold_max=max_val,
            actual_value=actual
        )
        return crud.anomalies.create(db, obj_in=anomaly_in)

    def _create_alert(self, db: Session, anomaly: schemas.anomaly.Anomaly) -> None:
        logger.info(f"Creating alert for anomaly {anomaly.id} for patient {anomaly.patient_id}.")
        alert_in = schemas.alert.AlertCreate(
            patient_id=anomaly.patient_id,
            anomaly_id=anomaly.id,
            severity=AlertSeverity.RED,
            message=f"Anomaly in {anomaly.disease}: value {anomaly.actual_value} is outside the normal range."
        )
        crud.alert.create(db=db, obj_in=alert_in)

    def get_multi_by_patient(
        self, db: Session, *, patient_id: int, skip: int = 0, limit: int = 100
    ) -> List[Vitals]:
        return (
            db.query(self.model)
            .filter(Vitals.patient_id == patient_id)
            .order_by(self.model.timestamp.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_by_patient(self, db: Session, *, patient_id: int) -> int:
        return db.query(self.model).filter(Vitals.patient_id == patient_id).count()

vitals = CRUDVitals(Vitals) 