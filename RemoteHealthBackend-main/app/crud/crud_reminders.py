from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models import ReminderFlag
from app.schemas.reminder import ReminderCheckResponse
from datetime import datetime, timedelta

class CRUDReminders(CRUDBase[ReminderFlag, None, None]):
    def check_missing_data(self, db: Session, patient_id: int) -> ReminderCheckResponse:
        flag = db.query(ReminderFlag).filter(ReminderFlag.patient_id == patient_id).first()
        if not flag or not flag.last_data_submission:
            return ReminderCheckResponse(missing=True)
        if datetime.utcnow() - flag.last_data_submission > timedelta(hours=48):
            return ReminderCheckResponse(missing=True)
        return ReminderCheckResponse(missing=False)

reminders = CRUDReminders(ReminderFlag) 