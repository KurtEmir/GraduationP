from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.reminder import ReminderCheckResponse
from app.crud import crud_reminders

router = APIRouter()

@router.get("/check-missing-data", response_model=ReminderCheckResponse)
def check_missing_data(
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_patient)
):
    return crud_reminders.reminders.check_missing_data(db, patient_id=current_user.id) 