from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, models
from app.api import deps
from app.schemas.patient import PatientDataResponse
from app.models.user_model import UserRole


router = APIRouter()


@router.get(
    "/me/patients",
    response_model=List[PatientDataResponse],
    status_code=status.HTTP_200_OK,
)
def get_my_patients(
    *,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get a list of patients assigned to the current doctor.
    """
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can access their assigned patients.",
        )

    patient_profiles = crud.patients.get_by_doctor_id(db, doctor_id=current_user.id)

    response_list = []
    for profile_model in patient_profiles:
        user_model = (
            db.query(models.User)
            .filter(models.User.id == profile_model.user_id)
            .first()
        )
        if user_model:
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
            response_list.append(PatientDataResponse(**response_data))

    return response_list 