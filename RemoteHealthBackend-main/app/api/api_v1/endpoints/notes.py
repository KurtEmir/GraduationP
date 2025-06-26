from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.note import Note, NoteCreate
from app.crud import crud_notes

router = APIRouter()

@router.post("/add", response_model=Note)
def add_note(
    *,
    db: Session = Depends(deps.get_db),
    note_in: NoteCreate,
    current_user=Depends(deps.get_current_doctor)
):
    return crud_notes.notes.add(db, doctor_id=current_user.id, obj_in=note_in)

@router.get("/{patient_id}", response_model=list[Note])
def get_notes(
    patient_id: int,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_doctor)
):
    return crud_notes.notes.get_by_patient(db, patient_id=patient_id) 