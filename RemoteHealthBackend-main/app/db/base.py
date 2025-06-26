# Import all the models, so that Base has them before being
# imported by Alembic
from app.models.base import Base  # noqa
from app.models.user_model import User  # noqa
from app.models.domain_models import PatientProfile, Vitals, Anomaly, Alert, Message, DoctorNotes, ReminderFlag, DiseaseThresholds, LocationCluster  # noqa 