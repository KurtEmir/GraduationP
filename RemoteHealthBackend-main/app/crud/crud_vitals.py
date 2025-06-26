from typing import List, Optional
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.domain_models import Vitals
from app.schemas.patient import VitalsCreate, VitalsUpdate, Vitals as VitalsSchema

class CRUDVitals(CRUDBase[Vitals, VitalsCreate, VitalsUpdate]):
    def get_vitals_by_patient_id(self, db: Session, *, patient_id: int, skip: int = 0, limit: int = 100) -> List[VitalsSchema]:
        return (
            db.query(self.model)
            .filter(self.model.patient_id == patient_id)
            .order_by(self.model.timestamp.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create_with_patient(
        self, db: Session, *, obj_in: VitalsCreate, patient_id: int
    ) -> Vitals:
        obj_in_data = obj_in.dict()
        db_obj = self.model(**obj_in_data, patient_id=patient_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_multi_by_patient(
        self, db: Session, *, patient_id: int, skip: int = 0, limit: int = 100
    ) -> List[Vitals]:
        return (
            db.query(self.model)
            .filter(Vitals.patient_id == patient_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_by_patient(self, db: Session, *, patient_id: int) -> int:
        return db.query(self.model).filter(Vitals.patient_id == patient_id).count()

vitals = CRUDVitals(Vitals) 