from app.schemas.patient import PatientDataResponse, Vitals as VitalsSchema, VitalsCreate, VitalsList

@router.get("/{patient_id}/vitals", response_model=List[PatientDataResponse])
def read_patient_vitals(
    patient_id: int,
    skip: int = 0,
    limit: int = 10,
    current_user: User = Depends(get_current_user)
):
    if not (current_user.id == patient_id or \
            current_user.role == UserRole.DOCTOR or \
            current_user.is_superuser):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view these vitals")
    
    db_vitals_models = crud_vitals.get_vitals_by_patient_id(db, patient_id=patient_id, skip=skip, limit=limit)
    # Serialize to Pydantic schema before printing to see what frontend should get
    serialized_vitals = [VitalsSchema.model_validate(vital_model) for vital_model in db_vitals_models]
    print(f"DEBUG: Returning SERIALIZED vitals for patient ID {patient_id}: {[v.model_dump_json() for v in serialized_vitals]}")
    return db_vitals_models # FastAPI will do its own serialization based on response_model

@router.post("/{patient_id}/vitals", response_model=VitalsSchema, status_code=status.HTTP_201_CREATED) 