from fastapi import APIRouter
from app.api.api_v1.endpoints import (
    alerts,
    anomalies,
    auth,
    doctors,
    location,
    messaging,
    notes,
    patient_records,
    reminders,
    simulator,
    thresholds,
    users,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(patient_records.router, prefix="/patient-records", tags=["patient-records"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
api_router.include_router(messaging.router, prefix="/messaging", tags=["messaging"])
api_router.include_router(notes.router, prefix="/notes", tags=["notes"])
api_router.include_router(location.router, prefix="/location", tags=["location"])
api_router.include_router(reminders.router, prefix="/reminders", tags=["reminders"])
api_router.include_router(anomalies.router, prefix="/anomalies", tags=["anomalies"])
api_router.include_router(thresholds.router, prefix="/disease-thresholds", tags=["disease-thresholds"])
api_router.include_router(simulator.router, prefix="/simulator", tags=["simulator"]) 
api_router.include_router(doctors.router, prefix="/doctors", tags=["doctors"]) 