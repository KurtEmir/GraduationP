from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func # Added func
from typing import List, Optional
from app.api import deps
from app.schemas.patient import PatientDataResponse, Vitals as VitalsSchema, VitalsCreate
from app.schemas.user import User as UserSchema
from app.crud import patients as crud_patients_obj
from app.crud import vitals as crud_vitals
from app.models.user_model import UserRole, User as UserModel
from app.models.domain_models import AlertSeverity, Alert # Added Alert
from app import models, schemas
import logging # Add logging

logger = logging.getLogger(__name__) # Re-enable logger instance

router = APIRouter()

@router.get("/me", response_model=PatientDataResponse)
async def read_patient_profile_me(
    db: Session = Depends(deps.get_db),
    current_user: schemas.User = Depends(deps.get_current_active_user),
):
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can access their own profile here.",
        )
    
    patient_profile_model = crud_patients_obj.get_by_user_id(db, user_id=current_user.id)
    
    if not patient_profile_model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found for the current user. Please create your profile.",
        )
    
    response_data = {
        "id": patient_profile_model.id,
        "user_id": patient_profile_model.user_id,
        "email": current_user.email,
        "role": current_user.role,
        "full_name": patient_profile_model.full_name,
        "age": patient_profile_model.age,
        "chronic_diseases": patient_profile_model.chronic_diseases,
        "date_of_birth": patient_profile_model.date_of_birth,
        "gender": patient_profile_model.gender,
        "address": patient_profile_model.address,
        "phone_number": patient_profile_model.phone_number,
        "risk_score": None, 
        "created_at": patient_profile_model.created_at,
        "updated_at": patient_profile_model.updated_at,
    }

    try:
        validated_response = PatientDataResponse(**response_data)
        return validated_response
    except Exception as e:
        logger.error(f"API: /me - Pydantic Validation or other error for user {current_user.email} while creating PatientDataResponse: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing patient profile: {str(e)}")

@router.get("/", response_model=List[PatientDataResponse])
def read_all_patient_profiles(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: UserSchema = Depends(deps.get_current_active_user),
):
    """
    Retrieve all patient profiles.
    If user is a doctor, retrieves only their assigned patients.
    If user is an admin, retrieves all patients.
    """
    if not (current_user.role in [UserRole.DOCTOR, UserRole.ADMIN] or current_user.is_superuser):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access patient profiles.",
        )
    
    user_db = db.query(UserModel).options(joinedload(UserModel.patients)).filter(UserModel.id == current_user.id).first()
    if not user_db:
        raise HTTPException(status_code=404, detail="Current user not found in database.")

    patients_to_return = []
    if user_db.role == UserRole.DOCTOR:
        patients_to_return = user_db.patients
    elif user_db.role == UserRole.ADMIN or user_db.is_superuser:
        all_users_with_profiles = db.query(UserModel).options(joinedload(UserModel.patient_profile)).filter(UserModel.patient_profile != None).all()
        patients_to_return = all_users_with_profiles

    paginated_patients = patients_to_return[skip : skip + limit]

    response_list = []
    for patient_user in paginated_patients:
        # The user object is the patient, fetch their profile
        profile_model = db.query(models.PatientProfile).filter(models.PatientProfile.user_id == patient_user.id).first()
        if profile_model:
            response_data = {
                "id": profile_model.id,
                "user_id": patient_user.id,
                "email": patient_user.email,
                "role": patient_user.role,
                "full_name": profile_model.full_name,
                "age": profile_model.age,
                "chronic_diseases": profile_model.chronic_diseases,
                "date_of_birth": profile_model.date_of_birth,
                "gender": profile_model.gender,
                "address": profile_model.address,
                "phone_number": profile_model.phone_number,
                "risk_score": None,
                "created_at": profile_model.created_at,
                "updated_at": profile_model.updated_at,
            }
        else:
            # If no profile, create a response with basic user info
            response_data = {
                "id": None,
                "user_id": patient_user.id,
                "email": patient_user.email,
                "role": patient_user.role,
                "full_name": f"{patient_user.first_name} {patient_user.last_name}",
                "age": None,
                "chronic_diseases": None,
                "date_of_birth": None,
                "gender": None,
                "address": None,
                "phone_number": None,
                "risk_score": None,
                "created_at": None, # No profile, so no creation date for it
                "updated_at": None,
            }
        response_list.append(PatientDataResponse(**response_data))
            
    return response_list

@router.get("/{patient_id}", response_model=PatientDataResponse)
def read_patient_profile_by_id(
    patient_id: int,
    db: Session = Depends(deps.get_db),
    current_user: UserSchema = Depends(deps.get_current_active_user),
):
    """
    Retrieve a specific patient's profile by their PatientProfile ID.
    Accessible only by DOCTOR or superuser.
    """
    if not (current_user.role == UserRole.DOCTOR or current_user.is_superuser):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this patient profile.",
        )

    # Fetch PatientProfile by its own ID using the generic get method from CRUDBase
    profile_model = crud_patients_obj.get(db, id=patient_id)
    if not profile_model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient profile with ID {patient_id} not found.",
        )

    # Fetch the associated User model to get email and role
    user_model = db.query(models.User).filter(models.User.id == profile_model.user_id).first()
    if not user_model: # Should ideally not happen if data is consistent
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User associated with patient profile ID {patient_id} not found.",
        )

    response_data = {
        "id": profile_model.id,
        "user_id": profile_model.user_id,
        "email": user_model.email,
        "role": user_model.role,
        "full_name": profile_model.full_name,
        "age": profile_model.age,
        "chronic_diseases": profile_model.chronic_diseases,
        "date_of_birth": profile_model.date_of_birth,
        "gender": profile_model.gender,
        "address": profile_model.address,
        "phone_number": profile_model.phone_number,
        "risk_score": None,
        "created_at": profile_model.created_at,
        "updated_at": profile_model.updated_at,
    }
    return PatientDataResponse(**response_data)

@router.get("/user/{user_id}", response_model=PatientDataResponse)
def read_patient_profile_by_user_id(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: UserSchema = Depends(deps.get_current_active_user),
):
    """
    Retrieve a specific patient's profile by their User ID.
    Accessible only by DOCTOR or superuser.
    """
    if not (current_user.role == UserRole.DOCTOR or current_user.is_superuser):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this patient profile.",
        )

    # Fetch the User model first
    user_model = db.query(models.User).filter(models.User.id == user_id).first()
    if not user_model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found.",
        )
    
    # Fetch the associated PatientProfile
    profile_model = db.query(models.PatientProfile).filter(models.PatientProfile.user_id == user_id).first()
    if not profile_model:
        # If no profile, we can still return basic user info as we did in the list view
        response_data = {
            "id": None,
            "user_id": user_model.id,
            "email": user_model.email,
            "role": user_model.role,
            "full_name": f"{user_model.first_name} {user_model.last_name}",
            "created_at": None, # No profile, so no timestamps
            "updated_at": None,
        }
        return PatientDataResponse(**response_data)

    # If profile exists, return full data
    response_data = {
        "id": profile_model.id,
        "user_id": profile_model.user_id,
        "email": user_model.email,
        "role": user_model.role,
        "full_name": profile_model.full_name,
        "age": profile_model.age,
        "chronic_diseases": profile_model.chronic_diseases,
        "date_of_birth": profile_model.date_of_birth,
        "gender": profile_model.gender,
        "address": profile_model.address,
        "phone_number": profile_model.phone_number,
        "risk_score": None,
        "created_at": profile_model.created_at,
        "updated_at": profile_model.updated_at,
    }
    return PatientDataResponse(**response_data)

@router.get("/{patient_id}/vitals", response_model=List[VitalsSchema])
def read_patient_vitals(
    *,
    db: Session = Depends(deps.get_db),
    patient_id: int,
    current_user: UserSchema = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100
):
    """Retrieve vital signs for a specific patient."""
    target_user = db.query(models.User).filter(models.User.id == patient_id, models.User.role == UserRole.PATIENT).first()
    if not target_user:
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Patient with user_id {patient_id} not found")

    # Extract the actual ID value from the SQLAlchemy model
    target_user_id = getattr(target_user, 'id')
    
    if not (current_user.id == target_user_id or \
            current_user.role in [UserRole.DOCTOR, UserRole.ADMIN] or \
            current_user.is_superuser):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view these vitals")
    
    db_vitals_models = crud_vitals.get_vitals_by_patient_id(db, patient_id=target_user_id, skip=skip, limit=limit)
    # Serialize to Pydantic schema before printing to see what frontend should get
    serialized_vitals = [VitalsSchema.model_validate(vital_model) for vital_model in db_vitals_models]
    return db_vitals_models

@router.post("/{patient_id}/vitals", response_model=VitalsSchema, status_code=status.HTTP_201_CREATED)
def create_patient_vital(
    *,
    db: Session = Depends(deps.get_db),
    patient_id: int,
    vital_in: VitalsCreate,
    current_user: UserSchema = Depends(deps.get_current_active_user)
):
    """Create new vital sign entry for a specific patient."""
    target_patient_user = db.query(models.User).filter(models.User.id == patient_id, models.User.role == UserRole.PATIENT).first()
    if not target_patient_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Patient with user_id {patient_id} not found for vitals creation")

    # Extract the actual ID value from the SQLAlchemy model
    target_patient_user_id = getattr(target_patient_user, 'id')
    
    if not (current_user.id == target_patient_user_id or \
            current_user.role in [UserRole.DOCTOR, UserRole.ADMIN] or \
            current_user.is_superuser):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to add vitals for this patient")

    return crud_vitals.create_with_patient(db, obj_in=vital_in, patient_id=target_patient_user_id)

@router.get("/ping")
def ping_patients_router():
    return {"message": "Patient_records router ping successful"}

@router.get("/clinical-overview/stats")
def get_clinical_overview_statistics(
    db: Session = Depends(deps.get_db),
    current_user: UserSchema = Depends(deps.get_current_active_user),
):
    """
    Retrieve aggregated statistics for the clinical overview dashboard.
    Accessible only by DOCTOR, ADMIN, or superuser.
    """
    if not (current_user.role in [UserRole.DOCTOR, UserRole.ADMIN] or current_user.is_superuser):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access clinical overview statistics.",
        )

    # Fetch the full user object from the DB to access relationships
    user_db = db.query(UserModel).filter(UserModel.id == current_user.id).first()
    if not user_db:
        raise HTTPException(status_code=404, detail="Current user not found in database.")

    total_patients = 0
    critical_alerts = 0
    warning_alerts = 0

    if user_db.role == UserRole.DOCTOR:
        # Correctly count patients via the relationship
        total_patients = len(user_db.patients)
        
        patient_ids = [patient.id for patient in user_db.patients]
        if patient_ids:
            alerts_query = db.query(Alert).filter(Alert.patient_id.in_(patient_ids))
            critical_alerts = alerts_query.filter(Alert.severity == AlertSeverity.RED, Alert.is_resolved == False).count()
            warning_alerts = alerts_query.filter(Alert.severity == AlertSeverity.YELLOW, Alert.is_resolved == False).count()

    elif user_db.role == UserRole.ADMIN or user_db.is_superuser:
        # Admins see all patients
        total_patients = db.query(models.PatientProfile).count()
        alerts_query = db.query(Alert)
        critical_alerts = alerts_query.filter(Alert.severity == AlertSeverity.RED, Alert.is_resolved == False).count()
        warning_alerts = alerts_query.filter(Alert.severity == AlertSeverity.YELLOW, Alert.is_resolved == False).count()
    
    # Placeholder values for other stats
    active_patients_count = total_patients 
    new_this_week_count = 0 # Placeholder, needs date-based logic
    urgent_alerts_count = critical_alerts # Assuming critical = urgent
    pending_review_alerts_count = 0 # Placeholder
    under_review_alerts_count = 0 # Placeholder
    resolved_today_alerts_count = 0 # Placeholder
    total_records_managed = 0 # Placeholder
    updated_today_records_count = 0 # Placeholder
    pending_review_records_count = 0 # Placeholder

    return {
        "total_patients": {
            "count": total_patients,
            "active": active_patients_count,
            "new_this_week": new_this_week_count
        },
        "critical_alerts": {
            "count": critical_alerts,
            "urgent": urgent_alerts_count,
            "pending_review": pending_review_alerts_count
        },
        "warning_alerts": {
            "count": warning_alerts,
            "under_review": under_review_alerts_count,
            "resolved_today": resolved_today_alerts_count
        },
        "health_records": {
            "count": total_records_managed,
            "updated_today": updated_today_records_count,
            "pending_review": pending_review_records_count
        }
    }

@router.get("/vital-signs/stats", response_model=List[dict])
async def get_vital_signs_activity_stats(
    db: Session = Depends(deps.get_db),
    current_user: schemas.User = Depends(deps.get_current_active_user),
):
    """
    Get aggregated statistics about vital signs activity by month.
    Returns the count of vital sign readings for each month.
    Accessible only by DOCTOR, ADMIN, or superuser.
    """
    # Check authorization
    if not (current_user.role in [UserRole.DOCTOR, UserRole.ADMIN] or current_user.is_superuser):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access vital signs activity statistics.",
        )
    
    # Import what we need
    from sqlalchemy import func, extract
    from datetime import datetime, timedelta
    import calendar
    
    user_db = db.query(UserModel).filter(UserModel.id == current_user.id).first()
    if not user_db:
        raise HTTPException(status_code=404, detail="Current user not found in database.")

    # Calculate date range (past 6 months including current month)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=180)  # Approximately 6 months
    
    vitals_query = db.query(
            extract('month', models.Vitals.timestamp).label('month_num'),
            func.count(models.Vitals.id).label('count')
        )

    # If user is a doctor, filter vitals by their assigned patients
    if user_db.role == UserRole.DOCTOR:
        assigned_patient_ids = [patient.id for patient in user_db.patients]
        if assigned_patient_ids:
            vitals_query = vitals_query.filter(models.Vitals.patient_id.in_(assigned_patient_ids))

    # Query to get counts of vital signs by month
    monthly_stats = (
        vitals_query.filter(
            models.Vitals.timestamp >= start_date,
            models.Vitals.timestamp <= end_date
        )
        .group_by('month_num')
        .order_by('month_num')
        .all()
    )
    
    # Convert to month names
    month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    # Format the response
    result = [
        {"month": month_names[int(month_num) - 1], "count": count}
        for month_num, count in monthly_stats
    ]
    
    # Fill in missing months with zero counts
    existing_months = {item['month'] for item in result}
    current_month = end_date.month
    
    for i in range(6):
        # Calculate month index going back from current month
        month_idx = (current_month - i - 1) % 12
        month_name = month_names[month_idx]
        if month_name not in existing_months:
            result.append({"month": month_name, "count": 0})
    
    # Sort by month in chronological order (past to present)
    current_month_idx = current_month - 1  # 0-based index
    sorted_result = sorted(
        result,
        key=lambda x: (month_names.index(x['month']) - current_month_idx) % 12
    )
    
    return sorted_result