from typing import Any, Dict, Optional, Union
from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password
from app.crud.base import CRUDBase
from app.models.user_model import User, UserRole, generate_doctor_code
from app.schemas.user import UserCreate, UserUpdate

class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    def create(self, db: Session, *, obj_in: UserCreate) -> User:
        doctor_id = None
        if obj_in.doctor_code:
            doctor = db.query(User).filter(User.doctor_code == obj_in.doctor_code, User.role == UserRole.DOCTOR).first()
            if doctor:
                doctor_id = doctor.id
            else:
                # Optionally, handle the case where the code is invalid.
                # For now, we'll just proceed without linking.
                pass

        db_obj = User(
            email=obj_in.email,
            first_name=obj_in.first_name,
            last_name=obj_in.last_name,
            role=obj_in.role,
            hashed_password=get_password_hash(obj_in.password),
            is_active=True,
            is_superuser=False,
            doctor_id=doctor_id  # Assign the found doctor's ID
        )
        if obj_in.role == UserRole.DOCTOR:
            db_obj.doctor_code = generate_doctor_code()
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self, db: Session, *, db_obj: User, obj_in: Union[UserUpdate, Dict[str, Any]]
    ) -> User:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        if update_data.get("password"):
            hashed_password = get_password_hash(update_data["password"])
            del update_data["password"]
            update_data["hashed_password"] = hashed_password
        return super().update(db, db_obj=db_obj, obj_in=update_data)

    def authenticate(self, db: Session, *, email: str, password: str) -> Optional[User]:
        user = self.get_by_email(db, email=email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    def is_active(self, user: User) -> bool:
        return user.is_active

    def is_superuser(self, user: User) -> bool:
        return user.is_superuser

user = CRUDUser(User) 