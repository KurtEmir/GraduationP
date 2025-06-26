from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models import DoctorNotes
from app.schemas.note import NoteCreate, NoteUpdate

class CRUDNotes(CRUDBase[DoctorNotes, NoteCreate, NoteUpdate]):
    def add(self, db: Session, doctor_id: int, obj_in: NoteCreate):
        db_obj = self.model(**obj_in.dict(), doctor_id=doctor_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_patient(self, db: Session, patient_id: int):
        return db.query(self.model).filter(DoctorNotes.patient_id == patient_id).all()

notes = CRUDNotes(DoctorNotes) 