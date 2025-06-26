from sqlalchemy.orm import Session
from typing import List
import datetime
from app.crud.base import CRUDBase
from app.models import Anomaly, DiseaseThresholds
from app.schemas.anomaly import AnomalyCreate, AnomalyUpdate, AnomalyCheckRequest, AnomalyCheckResponse

class CRUDAnomalies(CRUDBase[Anomaly, AnomalyCreate, AnomalyUpdate]):
    def check(self, db: Session, req: AnomalyCheckRequest) -> AnomalyCheckResponse:
        """
        Check vital signs against disease thresholds to detect anomalies
        """
        # Get patient's diseases and their thresholds
        patient_id = req.patient_id
        vitals = req.vitals
        detected_anomalies = []
        
        # Get disease thresholds from the database
        disease_thresholds = db.query(DiseaseThresholds).all()
        
        # If no disease thresholds are defined, use default ranges
        if not disease_thresholds:
            # Default threshold values for general health monitoring
            default_thresholds = {
                'systolic': {'min': 90, 'max': 140},
                'diastolic': {'min': 60, 'max': 90},
                'heart_rate': {'min': 60, 'max': 100},
                'pulse': {'min': 60, 'max': 100},
                'spo2': {'min': 95, 'max': 100},
                'temperature': {'min': 36.5, 'max': 37.5}
            }
            
            # Check each vital sign against default thresholds
            for vital_name, value in vitals.items():
                if vital_name in default_thresholds:
                    threshold = default_thresholds[vital_name]
                    if value < threshold['min'] or value > threshold['max']:
                        # Create anomaly record
                        anomaly_obj = Anomaly(
                            patient_id=patient_id,
                            vital_id=0,  # Placeholder for general vital
                            disease="General Health",
                            threshold_min=threshold['min'],
                            threshold_max=threshold['max'],
                            actual_value=value,
                            timestamp=datetime.datetime.utcnow()
                        )
                        db.add(anomaly_obj)
                        db.flush()
                        detected_anomalies.append(anomaly_obj)
        else:
            # Check each disease's thresholds
            for disease in disease_thresholds:
                # Check heart rate
                if 'heart_rate' in vitals and vitals['heart_rate'] is not None:
                    value = vitals['heart_rate']
                    if value < disease.heart_rate_min or value > disease.heart_rate_max:
                        # Create anomaly record
                        anomaly_obj = Anomaly(
                            patient_id=patient_id,
                            vital_id=0,  # We don't have a specific vital ID here
                            disease=disease.disease,
                            threshold_min=disease.heart_rate_min,
                            threshold_max=disease.heart_rate_max,
                            actual_value=value,
                            timestamp=datetime.datetime.utcnow()
                        )
                        db.add(anomaly_obj)
                        db.flush()
                        detected_anomalies.append(anomaly_obj)
                
                # Check temperature
                if 'temperature' in vitals and vitals['temperature'] is not None:
                    value = vitals['temperature']
                    if value < disease.temperature_min or value > disease.temperature_max:
                        # Create anomaly record
                        anomaly_obj = Anomaly(
                            patient_id=patient_id,
                            vital_id=0,  # We don't have a specific vital ID here
                            disease=disease.disease,
                            threshold_min=disease.temperature_min,
                            threshold_max=disease.temperature_max,
                            actual_value=value,
                            timestamp=datetime.datetime.utcnow()
                        )
                        db.add(anomaly_obj)
                        db.flush()
                        detected_anomalies.append(anomaly_obj)
                
                # Check SPO2
                if 'spo2' in vitals and vitals['spo2'] is not None:
                    value = vitals['spo2']
                    if value < disease.spo2_min or value > disease.spo2_max:
                        # Create anomaly record
                        anomaly_obj = Anomaly(
                            patient_id=patient_id,
                            vital_id=0,  # We don't have a specific vital ID here
                            disease=disease.disease,
                            threshold_min=disease.spo2_min,
                            threshold_max=disease.spo2_max,
                            actual_value=value,
                            timestamp=datetime.datetime.utcnow()
                        )
                        db.add(anomaly_obj)
                        db.flush()
                        detected_anomalies.append(anomaly_obj)
        
        # Commit all changes
        db.commit()
        
        return AnomalyCheckResponse(anomalies=detected_anomalies)

anomalies = CRUDAnomalies(Anomaly) 