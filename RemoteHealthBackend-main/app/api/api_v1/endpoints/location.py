from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.location import LocationReport, LocationCluster, LocationReportResponse
from app.crud import crud_location

router = APIRouter()

@router.post("/report", response_model=LocationReportResponse)
def report_location(
    *,
    db: Session = Depends(deps.get_db),
    location_in: LocationReport,
    current_user=Depends(deps.get_current_patient)
):
    return crud_location.location.report(db, patient_id=current_user.id, obj_in=location_in) 