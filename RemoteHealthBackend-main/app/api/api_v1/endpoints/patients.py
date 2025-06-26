from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.api import deps
from app.schemas.patient import (
    PatientDataResponse, 
    PatientProfileSelfCreateSchema, 
    PatientProfileSelfUpdateSchema, 
    PatientProfileCreate,
    Vitals as VitalsSchema,
    VitalsCreate
)
from app.crud import patients as crud_patients_obj
from app.crud import vitals as crud_vitals
from app.models.user_model import UserRole, User as UserModel
from app import models
from datetime import date

router = APIRouter()

@router.get("/", response_model=list[PatientDataResponse])
def get_patients(db: Session = Depends(deps.get_db), current_user: models.User = Depends(deps.get_current_active_user)):
    if not (current_user.role in [UserRole.DOCTOR, UserRole.ADMIN] or current_user.is_superuser):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource."
        )
    return crud_patients_obj.get_multi(db)

@router.post("/", response_model=PatientDataResponse)
def create_patient(
    *,
    db: Session = Depends(deps.get_db),
    patient_in: PatientProfileSelfCreateSchema,
    current_user: models.User = Depends(deps.get_current_active_user)
):
    if not (current_user.role == UserRole.DOCTOR or current_user.is_superuser):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create patient profiles."
        )
    if not hasattr(patient_in, 'user_id') or not hasattr(patient_in, 'full_name'):
         raise HTTPException(status_code=422, detail="Missing user_id or full_name for patient creation by admin/doctor.")
    
    patient_create_data = PatientProfileCreate(user_id=patient_in.user_id, full_name=patient_in.full_name, **patient_in.dict(exclude_unset=True, exclude={"user_id", "full_name"}))

    return crud_patients_obj.create(db, obj_in=patient_create_data)

@router.get("/{patient_id}", response_model=PatientDataResponse)
def get_patient(
    *,
    db: Session = Depends(deps.get_db),
    patient_id: int,
    current_user: models.User = Depends(deps.get_current_active_user)
):
    patient = crud_patients_obj.get(db, id=patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    if current_user.role == UserRole.PATIENT:
        if patient.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this patient profile",
            )
    elif current_user.role == UserRole.DOCTOR:
        pass
    elif current_user.is_superuser:
        pass
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access patient profiles",
        )

    return patient

@router.put("/{patient_id}", response_model=PatientDataResponse)
def update_patient(
    *,
    db: Session = Depends(deps.get_db),
    patient_id: int,
    patient_in: PatientProfileSelfUpdateSchema,
    current_user: UserModel = Depends(deps.get_current_active_user)
):
    patient_profile_to_update = crud_patients_obj.get(db, id=patient_id)
    if not patient_profile_to_update:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient profile not found")

    can_update = False
    if current_user.role == UserRole.PATIENT:
        if patient_profile_to_update.user_id == current_user.id:
            can_update = True
    elif current_user.role == UserRole.DOCTOR or current_user.is_superuser:
        can_update = True
    
    if not can_update:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this patient profile"
        )

    updated_profile = crud_patients_obj.update(db, db_obj=patient_profile_to_update, obj_in=patient_in)
    
    user_of_profile = db.query(UserModel).filter(UserModel.id == updated_profile.user_id).first()
    email_to_return = user_of_profile.email if user_of_profile else None
    role_to_return = user_of_profile.role if user_of_profile else None

    response_data = {
        "id": updated_profile.id,
        "user_id": updated_profile.user_id,
        "email": email_to_return,
        "role": role_to_return,
        "full_name": updated_profile.full_name,
        "age": updated_profile.age,
        "chronic_diseases": updated_profile.chronic_diseases,
        "date_of_birth": updated_profile.date_of_birth,
        "gender": updated_profile.gender,
        "address": updated_profile.address,
        "phone_number": updated_profile.phone_number,
        "created_at": updated_profile.created_at,
        "updated_at": updated_profile.updated_at,
    }
    try:
        return PatientDataResponse(**response_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error constructing updated patient profile response: {e}")

@router.get("/me")
def read_patient_profile_me():
    print("DEBUG: MINIMAL patients/me read_patient_profile_me STARTING NOW") 
    return {"message": "Minimal patients/me reached"}

@router.get("/ping")
def ping_patients_router():
    print("DEBUG: patients/ping STARTING NOW")
    return {"message": "Patients router ping successful"}

@router.post("/me", response_model=PatientDataResponse, status_code=status.HTTP_201_CREATED)
async def create_patient_profile_me(
    *,
    db: Session = Depends(deps.get_db),
    profile_in: PatientProfileSelfCreateSchema,
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Create a patient profile for the currently authenticated user.
    """
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can create their own profile.",
        )

    existing_profile = crud_patients_obj.get_by_user_id(db, user_id=current_user.id)
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Patient profile already exists for this user. Use PUT to update.",
        )
    
    # Prepare data for PatientProfileCreate schema
    patient_data_for_crud = profile_in.dict(exclude_unset=True)
    
    # Calculate age if date_of_birth is provided and age is not
    age_to_save = patient_data_for_crud.get("age")
    if patient_data_for_crud.get("date_of_birth") and age_to_save is None:
        today = date.today()
        born = patient_data_for_crud["date_of_birth"]
        # Ensure 'born' is a date object if it comes as string (though Pydantic should handle this for date fields)
        if isinstance(born, str):
            try:
                born = date.fromisoformat(born)
            except ValueError: # Should not happen if Pydantic validation is correct
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid date_of_birth format.")
        if isinstance(born, date): # Check again after potential conversion
             age_to_save = today.year - born.year - ((today.month, today.day) < (born.month, born.day))

    if age_to_save is not None:
        patient_data_for_crud["age"] = age_to_save
    
    # Ensure full_name is set
    final_full_name = patient_data_for_crud.get("full_name")
    if not final_full_name:
        final_full_name = f"{current_user.first_name} {current_user.last_name}".strip()
        if not final_full_name: # If still no full name (e.g. user has no first/last name)
             # The PatientProfileCreate schema requires full_name, so this path should ideally not be hit
             # if user creation enforces first/last name, or PatientProfileSelfCreateSchema makes full_name mandatory.
             # For now, let the CRUDBase create fail if full_name is still missing and PatientProfileCreate requires it.
             # Or, raise a more specific error here:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Full name is required and could not be derived.")
    
    patient_data_for_crud["full_name"] = final_full_name
    patient_data_for_crud["user_id"] = current_user.id

    # Create the PatientProfileCreate schema instance
    # We need to ensure all fields required by PatientProfileCreate are present.
    # PatientProfileCreate requires: user_id, full_name. Other fields are from PatientProfileBase (optional).
    
    # Filter patient_data_for_crud to only include fields expected by PatientProfileCreate's base (PatientProfileBase) + user_id + full_name
    # PatientProfileCreate inherits PatientProfileBase and adds user_id, full_name
    fields_for_patient_profile_create = {
        key: value for key, value in patient_data_for_crud.items() 
        if key in PatientProfileCreate.model_fields  # Pydantic v2
        # if key in PatientProfileCreate.__fields__ # Pydantic v1
    }
    # Ensure mandatory fields are present
    fields_for_patient_profile_create["user_id"] = current_user.id
    fields_for_patient_profile_create["full_name"] = final_full_name


    # Create an instance of the schema expected by the CRUD operation
    try:
        patient_create_schema = PatientProfileCreate(**fields_for_patient_profile_create)
    except Exception as e: # Catch Pydantic validation error if something is wrong
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Error preparing data for profile creation: {e}")

    db_obj = crud_patients_obj.create(db, obj_in=patient_create_schema)
    
    # Construct response using Pydantic's model_validate and enrich with user data
    patient_response = PatientDataResponse.model_validate(db_obj)
    patient_response.email = current_user.email
    patient_response.role = current_user.role
    # Ensure user_id in response is from the user model if it's the source of truth for the association
    # or confirm db_obj.user_id is correctly set and preferred.
    # For this setup, db_obj.user_id was set from current_user.id, so it's consistent.

    return patient_response

@router.put("/me", response_model=PatientDataResponse)
async def update_patient_profile_me(
    *,
    db: Session = Depends(deps.get_db),
    profile_in: PatientProfileSelfUpdateSchema,
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Update the patient profile for the currently authenticated user.
    """
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can update their own profile.",
        )

    patient_profile_to_update = crud_patients_obj.get_by_user_id(db, user_id=current_user.id)
    if not patient_profile_to_update:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found for this user. Use POST to create.",
        )

    # Yaşı doğum tarihinden hesaplama (isteğe bağlı)
    updated_data = profile_in.dict(exclude_unset=True)
    age_to_save = updated_data.get("age")
    if updated_data.get("date_of_birth") and age_to_save is None:
        today = date.today()
        born = updated_data.get("date_of_birth")
        if isinstance(born, str): # Eğer string geliyorsa date objesine çevir
            try:
                born = date.fromisoformat(born)
            except ValueError:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid date_of_birth format. Use YYYY-MM-DD.")
        if isinstance(born, date): # Sadece date objesi ise hesapla
            age_to_save = today.year - born.year - ((today.month, today.day) < (born.month, born.day))

    if age_to_save is not None:
        updated_data["age"] = age_to_save
    elif "age" in updated_data and updated_data["age"] is None: # Yaşı silmek istiyorsa
        updated_data["age"] = None # Nullable olduğu için izin ver

    updated_profile = crud_patients_obj.update(db, db_obj=patient_profile_to_update, obj_in=updated_data)
    
    # Construct response using Pydantic's model_validate and enrich with user data
    patient_response = PatientDataResponse.model_validate(updated_profile)
    patient_response.email = current_user.email
    patient_response.role = current_user.role

    return patient_response

@router.get("/{patient_id}/vitals", response_model=List[VitalsSchema])
def read_patient_vitals(
    *,
    db: Session = Depends(deps.get_db),
    patient_id: int,
    current_user: UserModel = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100
):
    """Retrieve vital signs for a specific patient."""
    patient_profile = crud_patients_obj.get(db, id=patient_id)
    if not patient_profile:
        target_user = db.query(models.User).filter(models.User.id == patient_id, models.User.role == UserRole.PATIENT).first()
        if not target_user:
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Patient with user_id {patient_id} not found")
    else:
        pass

    target_patient_user_id = patient_id

    if not (current_user.id == target_patient_user_id or \
            current_user.role == UserRole.DOCTOR or \
            current_user.is_superuser):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view these vitals")
    
    db_vitals = crud_vitals.get_vitals_by_patient_id(db, patient_id=target_patient_user_id, skip=skip, limit=limit)
    return db_vitals

@router.post("/{patient_id}/vitals", response_model=VitalsSchema, status_code=status.HTTP_201_CREATED)
def create_patient_vital(
    *,
    db: Session = Depends(deps.get_db),
    patient_id: int,
    vital_in: VitalsCreate,
    current_user: UserModel = Depends(deps.get_current_active_user)
):
    """Create new vital sign entry for a specific patient."""
    target_patient_user = db.query(models.User).filter(models.User.id == patient_id, models.User.role == UserRole.PATIENT).first()
    if not target_patient_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Patient with user_id {patient_id} not found for vitals creation")

    if not (current_user.id == target_patient_user.id or \
            current_user.role == UserRole.DOCTOR or \
            current_user.is_superuser):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to add vitals for this patient")

    return crud_vitals.create_with_patient(db, obj_in=vital_in, patient_id=target_patient_user.id) 