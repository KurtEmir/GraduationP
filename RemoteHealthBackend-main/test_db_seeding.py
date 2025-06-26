#!/usr/bin/env python3

import sys
import os

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.domain_models import DiseaseThresholds, Anomaly as AnomalyModel, Alert as AlertModel, Vitals as VitalsModel
from app.models.user_model import User

def test_db_seeding():
    """Test if the database seeding worked properly"""
    db: Session = SessionLocal()
    
    try:
        # Check if users were created
        users = db.query(User).all()
        print(f"Total users in database: {len(users)}")
        for user in users:
            print(f"  - {user.email} (Role: {user.role})")
        
        # Check if disease thresholds were created
        thresholds = db.query(DiseaseThresholds).all()
        print(f"\nTotal disease thresholds: {len(thresholds)}")
        for threshold in thresholds:
            print(f"  - {threshold.disease}: HR {threshold.heart_rate_min}-{threshold.heart_rate_max}")
        
        # Check if vitals were created
        vitals = db.query(VitalsModel).all()
        print(f"\nTotal vitals records: {len(vitals)}")
        for vital in vitals:
            print(f"  - Patient {vital.patient_id}: HR {vital.heart_rate}, Temp {vital.temperature}")
        
        # Check if anomalies were created
        anomalies = db.query(AnomalyModel).all()
        print(f"\nTotal anomalies: {len(anomalies)}")
        for anomaly in anomalies:
            print(f"  - Patient {anomaly.patient_id}: {anomaly.disease} - {anomaly.actual_value} (Threshold: {anomaly.threshold_min}-{anomaly.threshold_max})")
        
        # Check if alerts were created
        alerts = db.query(AlertModel).all()
        print(f"\nTotal alerts: {len(alerts)}")
        for alert in alerts:
            print(f"  - Patient {alert.patient_id}: {alert.message} ({alert.severity})")
            
        print("\n✅ Database seeding test completed successfully!")
        
    except Exception as e:
        print(f"❌ Error testing database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_db_seeding()
