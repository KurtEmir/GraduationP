from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.user import User, UserUpdate
from app.crud import user as user_crud

router = APIRouter()

@router.get("/me", response_model=User)
def read_current_user(db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_active_user)):
    return current_user

@router.put("/update", response_model=User)
def update_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserUpdate,
    current_user: User = Depends(deps.get_current_active_user)
):
    updated_user = user_crud.update(db, db_obj=current_user, obj_in=user_in)
    return updated_user 