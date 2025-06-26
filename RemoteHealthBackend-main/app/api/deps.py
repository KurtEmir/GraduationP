import logging
from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core import security
from app.core.config import settings
from app.db.session import SessionLocal
from app.schemas.user import TokenPayload, User as UserSchema
from app.crud import crud_user
from app.models.user_model import UserRole

# logger = logging.getLogger(__name__) # Temporarily comment out logger instance if suspected

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(reusable_oauth2)
) -> UserSchema:
    # logger.info(f"deps.get_current_user called. Token received: {token[:20]}...")
    try:
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET, 
            algorithms=[settings.JWT_ALGORITHM],
        )
        token_data = TokenPayload(**payload)
        # logger.info(f"deps.get_current_user: Token decoded, payload subject (user_id): {token_data.sub}")
    except jwt.ExpiredSignatureError as e:
        error_detail = "Token has expired"
        # logger.error(f"deps.get_current_user: JWT ExpiredSignatureError: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error_detail,
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.JWTError as e: 
        error_detail = f"Could not validate credentials (JWTError: {type(e).__name__} - {str(e)})"
        # logger.error(f"deps.get_current_user: JWT JWTError: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error_detail, 
            headers={"WWW-Authenticate": "Bearer"},
        )
    except ValidationError as e:
        error_detail = f"Could not validate credentials (ValidationError: Invalid token payload structure - {str(e)})"
        # logger.error(f"deps.get_current_user: JWT ValidationError: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail=error_detail,
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_model = crud_user.user.get(db, id=token_data.sub)
    if not user_model:
        # logger.error(f"deps.get_current_user: User not found in DB for ID: {token_data.sub}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found based on token subject")
    
    # logger.info(f"deps.get_current_user: User {user_model.email} (ID: {user_model.id}) found in DB.")
    try:
        user_schema_instance = UserSchema.from_orm(user_model)
        # logger.info(f"deps.get_current_user: Successfully converted user_model to UserSchema for {user_model.email}")
        return user_schema_instance
    except Exception as e:
        # logger.error(f"deps.get_current_user: Error converting user_model to UserSchema for user ID {user_model.id if user_model else 'None'}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error processing user data from token")

def get_current_active_user(
    current_user: UserSchema = Depends(get_current_user),
) -> UserSchema:
    # logger.info(f"deps.get_current_active_user called for user: {current_user.email} (ID: {current_user.id})")
    if not crud_user.user.is_active(current_user):
        # logger.warning(f"deps.get_current_active_user: User {current_user.email} is inactive.")
        raise HTTPException(status_code=400, detail="Inactive user")
    # logger.info(f"deps.get_current_active_user: User {current_user.email} is active.")
    return current_user

def get_current_active_superuser(
    current_user: UserSchema = Depends(get_current_user),
) -> UserSchema:
    if not crud_user.user.is_superuser(current_user):
        raise HTTPException(
            status_code=400, detail="The user doesn't have enough privileges"
        )
    return current_user

def get_current_doctor(
    current_user: UserSchema = Depends(get_current_user),
) -> UserSchema:
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=400, detail="The user is not a doctor"
        )
    return current_user

def get_current_patient(
    current_user: UserSchema = Depends(get_current_user),
) -> UserSchema:
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=400, detail="The user is not a patient"
        )
    return current_user

def get_current_admin(
    current_user: UserSchema = Depends(get_current_user),
) -> UserSchema:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=400, detail="The user is not an admin"
        )
    return current_user

def is_healthcare_provider(user: UserSchema) -> bool:
    """Check if user is a healthcare provider (DOCTOR or ADMIN)"""
    return user.role in [UserRole.DOCTOR, UserRole.ADMIN] or user.is_superuser

def get_current_healthcare_provider(
    current_user: UserSchema = Depends(get_current_user),
) -> UserSchema:
    """Dependency that ensures user is either DOCTOR, ADMIN, or superuser"""
    if not is_healthcare_provider(current_user):
        raise HTTPException(
            status_code=403, detail="Access restricted to healthcare providers"
        )
    return current_user