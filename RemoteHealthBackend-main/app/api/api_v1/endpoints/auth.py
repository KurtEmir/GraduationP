from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import crud, schemas
from app.api import deps
from app.core import security
from app.core.config import settings
from app.schemas.user import AuthResponse, User as UserSchema
from app.models import User as UserModel
from app.models.user_model import UserRole

router = APIRouter()

@router.post("/register", response_model=AuthResponse)
def register(
    *,
    db: Session = Depends(deps.get_db),
    user_in: schemas.UserCreate,
) -> Any:
    """
    Register new user.
    """
    user = crud.user.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system.",
        )
    user = crud.user.create(db, obj_in=user_in)
    
    # Re-introducing the logic to auto-create a patient profile
    if user.role == UserRole.PATIENT:
        from app.crud import patients as crud_patients
        from app.schemas.patient import PatientProfileCreate
        
        # Create a patient profile linked to the new user
        patient_profile_data = PatientProfileCreate(
            user_id=user.id,
            full_name=f"{user.first_name} {user.last_name}",
            # The user object already has the correct doctor_id from the create step
            doctor_id=user.doctor_id, 
            # Set other fields to default/null values
            age=None,
            date_of_birth=None,
            gender="Not specified",
            chronic_diseases="None",
            address=None,
            phone_number=None
        )
        crud_patients.create(db, obj_in=patient_profile_data)
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        user.id, expires_delta=access_token_expires
    )
    return {
        "user": user,
        "token": {"access_token": access_token, "token_type": "bearer"}
    }

@router.post("/login", response_model=AuthResponse)
def login(
    db: Session = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = crud.user.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    elif not crud.user.is_active(user):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        user.id, expires_delta=access_token_expires
    )
    return {
        "user": user,
        "token": {"access_token": access_token, "token_type": "bearer"}
    }

@router.get("/me", response_model=UserSchema)
def read_users_me(
    current_user: UserModel = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get current user.
    """
    return current_user

@router.get("/me2")
def test_me2_in_auth_router():
    print("DEBUG: MINIMAL /auth/me2 STARTING NOW")
    return {"message": "Minimal /auth/me2 reached"}

@router.get("/check-email")
def check_email_exists(
    email: str,
    db: Session = Depends(deps.get_db)
) -> Any:
    """
    Check if a user with the given email already exists in the system.
    """
    user = crud.user.get_by_email(db, email=email)
    return {"exists": user is not None} 