import logging

from app.db.init_db import init_db
from app.db.session import SessionLocal
from app import crud
from app.models.domain_models import Vitals as VitalsModel, Anomaly as AnomalyModel, Alert as AlertModel
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main() -> None:
    logger.info("Creating initial data")
    db = SessionLocal()

    patient_user_email = "patient1@example.com"
    patient_user_for_cleanup = crud.user.get_by_email(db, email=patient_user_email)
    
    if patient_user_for_cleanup:
        patient_id_to_clean = patient_user_for_cleanup.id
        logger.info(f"Attempting to delete dependent data for user ID: {patient_id_to_clean} ({patient_user_email})")

        # Delete Alerts first (dependent on Anomalies)
        db.query(AlertModel).filter(AlertModel.patient_id == patient_id_to_clean).delete(synchronize_session=False)
        db.commit()
        logger.info(f"Alerts deleted for user ID: {patient_id_to_clean}")

        # Delete Anomalies (dependent on Vitals)
        db.query(AnomalyModel).filter(AnomalyModel.patient_id == patient_id_to_clean).delete(synchronize_session=False)
        db.commit()
        logger.info(f"Anomalies deleted for user ID: {patient_id_to_clean}")

        # Delete Vitals
        db.query(VitalsModel).filter(VitalsModel.patient_id == patient_id_to_clean).delete(synchronize_session=False)
        db.commit()
        logger.info(f"Vitals deleted for user ID: {patient_id_to_clean}")
    else:
        logger.warning(f"User {patient_user_email} not found for data cleanup.")

    init_db(db)
    logger.info("Initial data created")

if __name__ == "__main__":
    main() 