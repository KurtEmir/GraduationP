from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.user import User, UserUpdate
from app.crud import user as user_crud
from app.models.user_model import User as UserModel, UserRole
from fastapi import status

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

@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
def delete_user(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
    current_user: UserModel = Depends(deps.get_current_active_user)
):
    """
    Delete a user.
    Accessible only by DOCTOR or superuser.
    """
    if not (current_user.is_superuser or current_user.role == UserRole.DOCTOR):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to delete a user."
        )

    user_to_delete = user_crud.get(db, id=user_id)
    if not user_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    # Add any additional authorization logic here, e.g., a doctor can only delete their own patients.
    # For now, we'll allow a doctor to delete any user if they have the role.

    deleted_user = user_crud.remove(db, id=user_id)
    return {"message": "User deleted successfully", "user_id": deleted_user.id} 