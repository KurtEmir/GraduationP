from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models import LocationCluster
from app.schemas.location import LocationReport

class CRUDLocation(CRUDBase[LocationCluster, LocationReport, LocationReport]):
    def report(self, db: Session, patient_id: int, obj_in: LocationReport):
        db_obj = self.model(**obj_in.dict())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

location = CRUDLocation(LocationCluster) 