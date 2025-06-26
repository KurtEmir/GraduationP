from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.anomaly import Anomaly, AnomalyCheckRequest, AnomalyCheckResponse
from app.crud import crud_anomalies

router = APIRouter()

@router.post("/check", response_model=AnomalyCheckResponse)
def check_anomalies(
    req: AnomalyCheckRequest,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_active_user)
):
    result = crud_anomalies.anomalies.check(db, req)
    return result 