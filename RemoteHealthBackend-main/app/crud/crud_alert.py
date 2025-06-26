from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.sql import func # For onupdate with resolved_at
from datetime import datetime # Added datetime

from app.crud.base import CRUDBase
from app.models.domain_models import Alert, AlertSeverity # Added AlertSeverity, Model
from app.schemas.alert import AlertCreate, AlertUpdate # Schemas

class CRUDAlert(CRUDBase[Alert, AlertCreate, AlertUpdate]):
    def create_alert(self, db: Session, *, obj_in: AlertCreate) -> Alert:
        # is_resolved defaults to False in model/schema, created_at is server_default
        db_obj = self.model(**obj_in.model_dump()) # Use model_dump() for Pydantic v2
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_alerts_by_patient_id(
        self, db: Session, *, patient_id: int, skip: int = 0, limit: int = 100, only_active: bool = False
    ) -> List[Alert]:
        query = db.query(self.model).filter(self.model.patient_id == patient_id)
        if only_active:
            query = query.filter(self.model.is_resolved == False)
        return query.order_by(self.model.created_at.desc()).offset(skip).limit(limit).all()
    
    def get_all_alerts(
        self, 
        db: Session, 
        *, 
        skip: int = 0, 
        limit: int = 100, 
        patient_id_filter: Optional[int] = None,
        severity_filter: Optional[AlertSeverity] = None,
        start_date_filter: Optional[datetime] = None,
        end_date_filter: Optional[datetime] = None,
        is_resolved_filter: Optional[bool] = None,
        sort_by: Optional[str] = "created_at_desc" # Default sort
    ) -> List[Alert]:
        query = db.query(self.model)

        if patient_id_filter is not None:
            query = query.filter(self.model.patient_id == patient_id_filter)
        
        if severity_filter is not None:
            query = query.filter(self.model.severity == severity_filter)

        if start_date_filter is not None:
            query = query.filter(self.model.created_at >= start_date_filter)
        
        if end_date_filter is not None:
            query = query.filter(self.model.created_at <= end_date_filter)

        if is_resolved_filter is not None:
            query = query.filter(self.model.is_resolved == is_resolved_filter)
        
        # Sorting logic
        if sort_by == "created_at_desc":
            query = query.order_by(self.model.created_at.desc())
        elif sort_by == "created_at_asc":
            query = query.order_by(self.model.created_at.asc())
        elif sort_by == "severity_desc":
            # Enum sorting might need specific handling if direct asc/desc doesn't work as expected
            # For now, assuming direct ordering works or can be adjusted later if needed
            query = query.order_by(self.model.severity.desc())
        elif sort_by == "severity_asc":
            query = query.order_by(self.model.severity.asc())
        else: # Default sort if invalid sort_by is provided
            query = query.order_by(self.model.created_at.desc())
            
        return query.offset(skip).limit(limit).all()

    def resolve_alert(self, db: Session, *, alert_id: int) -> Optional[Alert]:
        db_alert = self.get(db, id=alert_id)
        if db_alert and not db_alert.is_resolved:
            db_alert.is_resolved = True
            db_alert.resolved_at = func.now() # Use func.now() for database timestamp
            db.add(db_alert)
            db.commit()
            db.refresh(db_alert)
            return db_alert
        return db_alert # Return alert even if already resolved or not found (None)

alert = CRUDAlert(Alert) 