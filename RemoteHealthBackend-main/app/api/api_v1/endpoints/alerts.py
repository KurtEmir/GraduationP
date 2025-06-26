import logging # Logging eklendi
from typing import List, Optional
from datetime import datetime # Added datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.crud import alert as crud_alert
from app.crud import patients as crud_patients # To check patient existence
from app.schemas.alert import Alert as AlertSchema, AlertCreate, AlertUpdate # Schemas
from app.schemas.user import User as UserSchema
from app.models.user_model import UserRole, User as UserModel
from app.models.domain_models import Alert as AlertModel, AlertSeverity # Domain model & AlertSeverity

logger = logging.getLogger(__name__) # Logger eklendi
logging.basicConfig(level=logging.INFO) # Temel logging konfigürasyonu eklendi

router = APIRouter()

@router.get("/patient/{patient_id}", response_model=List[AlertSchema])
def get_alerts_for_patient(
    *,
    db: Session = Depends(deps.get_db),
    patient_id: int, # Important: Is this parameter User.id or PatientProfile.id?
    current_user: UserSchema = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100,
    active: bool = Query(False, description="Filter for active (unresolved) alerts only.")
):
    """Retrieve alerts for a specific patient."""
    logger.info(f"API CALL: get_alerts_for_patient CALLED for patient_id: {patient_id} by user {current_user.email}")

    # Ensure patient exists - assuming patient_id is User.id and they are a patient.
    # Pay attention to whether the frontend sends User.id or PatientProfile.id as patient_id!
    # Current assumption: incoming patient_id is User.id
    logger.info(f"Attempting to find user with User.id = {patient_id} and role PATIENT.")
    target_patient_user = db.query(UserModel).filter(UserModel.id == patient_id, UserModel.role == UserRole.PATIENT).first()
    
    if not target_patient_user:
        logger.warning(f"Patient user with User.id = {patient_id} NOT FOUND or is not a PATIENT. Raising 404.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Patient with user_id {patient_id} not found")
    
    logger.info(f"Found patient user: {target_patient_user.email} (User.id={target_patient_user.id})")

    # Authorization
    # A patient can see their own alerts. A doctor or superuser can see any patient's alerts.
    can_view = False
    if current_user.id == target_patient_user.id: # Patient viewing their own
        can_view = True
        logger.info(f"User {current_user.email} is viewing their own alerts.")
    elif current_user.role == UserRole.DOCTOR or current_user.is_superuser: # Doctor/Superuser viewing
        can_view = True
        logger.info(f"User {current_user.email} (Role: {current_user.role}) is authorized to view alerts for patient {target_patient_user.email}.")
    
    if not can_view:
        logger.warning(f"User {current_user.email} is NOT AUTHORIZED to view alerts for patient {target_patient_user.email}. Raising 403.")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view these alerts")

    # If Doctor, further check if they are associated with this patient (future enhancement)
    # This part is currently skipped; doctors are assumed to be able to see all patients' alerts.
    
    # Does the crud_alert.get_alerts_by_patient_id function expect User.id as patient_id? This is important.
    # If it expects PatientProfile.id, a value like target_patient_user.patient_profile.id should be passed (if such a relationship exists).
    # For now, we proceed with User.id (i.e., the incoming patient_id).
    logger.info(f"Fetching alerts from CRUD using patient_id(User.id): {target_patient_user.id}, skip: {skip}, limit: {limit}, active: {active}")
    alerts = crud_alert.get_alerts_by_patient_id(db, patient_id=target_patient_user.id, skip=skip, limit=limit, only_active=active)
    
    if not alerts:
        logger.info(f"No alerts found in CRUD for patient_id(User.id): {target_patient_user.id}. Returning empty list with 200 OK.")
        return [] # If the patient exists but has no alerts, return an empty list and 200 OK. The previous 404 was removed.
        
    logger.info(f"Returning {len(alerts)} alerts for patient_id(User.id): {target_patient_user.id}.")
    return alerts

@router.get("/", response_model=List[AlertSchema])
def get_all_alerts_enhanced(
    *,
    db: Session = Depends(deps.get_db),
    current_user: UserSchema = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100,
    patient_id: Optional[int] = Query(None, description="Filter by patient User ID"),
    severity: Optional[AlertSeverity] = Query(None, description="Filter by alert severity (red, yellow, blue)"),
    start_date: Optional[datetime] = Query(None, description="Filter alerts created on or after this date (ISO format YYYY-MM-DDTHH:MM:SS)"),
    end_date: Optional[datetime] = Query(None, description="Filter alerts created on or before this date (ISO format YYYY-MM-DDTHH:MM:SS)"),
    is_resolved: Optional[bool] = Query(None, description="Filter by resolution status (True for resolved, False for unresolved)"),
    sort_by: Optional[str] = Query("created_at_desc", description="Sort alerts by: created_at_desc, created_at_asc, severity_desc, severity_asc")
):
    """Retrieve all alerts in the system with advanced filtering and sorting. Only for Doctor/Admin."""
    if not (current_user.role in [UserRole.DOCTOR, UserRole.ADMIN] or current_user.is_superuser):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access all system alerts")

    alerts = crud_alert.get_all_alerts(
        db,
        skip=skip,
        limit=limit,
        patient_id_filter=patient_id,
        severity_filter=severity,
        start_date_filter=start_date,
        end_date_filter=end_date,
        is_resolved_filter=is_resolved,
        sort_by=sort_by
    )
    return alerts

# Placeholder for POST /alerts if needed later (e.g. system generated alerts not tied to a specific user action via API)
# @router.post("/", response_model=AlertSchema, status_code=status.HTTP_201_CREATED)
# def create_new_alert(...): ...

# Placeholder for PUT /alerts/{alert_id}/resolve if needed (or similar)
@router.put("/{alert_id}/resolve", response_model=AlertSchema)
def resolve_alert_endpoint(
    alert_id: int,
    db: Session = Depends(deps.get_db),
    current_user: UserModel = Depends(deps.get_current_active_user)
):
    """Mark an alert as resolved. Typically by Doctor/Admin."""
    if not (current_user.role == UserRole.DOCTOR or current_user.is_superuser):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to resolve alerts")

    resolved_alert = crud_alert.resolve_alert(db, alert_id=alert_id)
    if not resolved_alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    if not resolved_alert.is_resolved: # Should have been resolved by CRUD, or was already.
        # This state might indicate an issue if it was expected to be resolved and wasn't.
        # However, resolve_alert CRUD returns the object, so we check its state.
        pass # Already handled by returning the object from CRUD.
    return resolved_alert 