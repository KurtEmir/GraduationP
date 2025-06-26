from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.api import deps
from app import models, schemas
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Mock disease thresholds data
MOCK_THRESHOLDS = [
    {
        "id": 1,
        "disease_name": "Hypertension",
        "vital_sign": "blood_pressure_systolic",
        "min_threshold": 90,
        "max_threshold": 140,
        "unit": "mmHg",
        "severity": "WARNING"
    },
    {
        "id": 2,
        "disease_name": "Hypertension",
        "vital_sign": "blood_pressure_diastolic",
        "min_threshold": 60,
        "max_threshold": 90,
        "unit": "mmHg",
        "severity": "WARNING"
    },
    {
        "id": 3,
        "disease_name": "Tachycardia",
        "vital_sign": "heart_rate",
        "min_threshold": 60,
        "max_threshold": 100,
        "unit": "bpm",
        "severity": "CRITICAL"
    },
    {
        "id": 4,
        "disease_name": "Hypothermia",
        "vital_sign": "temperature",
        "min_threshold": 36.5,
        "max_threshold": 37.5,
        "unit": "°C",
        "severity": "WARNING"
    },
    {
        "id": 5,
        "disease_name": "Hypoxemia",
        "vital_sign": "oxygen_saturation",
        "min_threshold": 95,
        "max_threshold": 100,
        "unit": "%",
        "severity": "CRITICAL"
    },
    {
        "id": 6,
        "disease_name": "Diabetes",
        "vital_sign": "blood_glucose",
        "min_threshold": 70,
        "max_threshold": 140,
        "unit": "mg/dL",
        "severity": "WARNING"
    }
]

@router.get("/", response_model=List[dict])
@router.get("", response_model=List[dict])
async def get_all_thresholds(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
    current_user: schemas.User = Depends(deps.get_current_active_user),
):
    """
    Retrieve all disease thresholds.
    """
    try:
        logger.info(f"User {current_user.email} requested disease thresholds")
        # Return mock data for now
        return MOCK_THRESHOLDS[skip:skip + limit]
    except Exception as e:
        logger.error(f"Error fetching thresholds: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching disease thresholds"
        )

@router.get("/{threshold_id}", response_model=dict)
async def get_threshold_by_id(
    threshold_id: int,
    db: Session = Depends(deps.get_db),
    current_user: schemas.User = Depends(deps.get_current_active_user),
):
    """
    Retrieve a specific disease threshold by ID.
    """
    try:
        threshold = next((t for t in MOCK_THRESHOLDS if t["id"] == threshold_id), None)
        if not threshold:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Threshold not found"
            )
        return threshold
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching threshold {threshold_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching threshold"
        )

@router.get("/disease/{disease_name}", response_model=List[dict])
async def get_thresholds_by_disease(
    disease_name: str,
    db: Session = Depends(deps.get_db),
    current_user: schemas.User = Depends(deps.get_current_active_user),
):
    """
    Retrieve thresholds for a specific disease.
    """
    try:
        disease_thresholds = [
            t for t in MOCK_THRESHOLDS 
            if t["disease_name"].lower() == disease_name.lower()
        ]
        return disease_thresholds
    except Exception as e:
        logger.error(f"Error fetching thresholds for disease {disease_name}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching disease thresholds"
        )

@router.post("/", response_model=dict)
async def create_threshold(
    threshold_data: dict,
    db: Session = Depends(deps.get_db),
    current_user: schemas.User = Depends(deps.get_current_active_user),
):
    """
    Create a new disease threshold.
    """
    try:
        # For now, just return the input data with a mock ID
        new_threshold = {
            "id": len(MOCK_THRESHOLDS) + 1,
            **threshold_data
        }
        MOCK_THRESHOLDS.append(new_threshold)
        return new_threshold
    except Exception as e:
        logger.error(f"Error creating threshold: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating threshold"
        )

@router.put("/{threshold_id}", response_model=dict)
async def update_threshold(
    threshold_id: int,
    threshold_data: dict,
    db: Session = Depends(deps.get_db),
    current_user: schemas.User = Depends(deps.get_current_active_user),
):
    """
    Update an existing disease threshold.
    """
    try:
        threshold_index = next(
            (i for i, t in enumerate(MOCK_THRESHOLDS) if t["id"] == threshold_id), 
            None
        )
        if threshold_index is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Threshold not found"
            )
        
        MOCK_THRESHOLDS[threshold_index].update(threshold_data)
        return MOCK_THRESHOLDS[threshold_index]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating threshold {threshold_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating threshold"
        )

@router.delete("/{threshold_id}")
async def delete_threshold(
    threshold_id: int,
    db: Session = Depends(deps.get_db),
    current_user: schemas.User = Depends(deps.get_current_active_user),
):
    """
    Delete a disease threshold.
    """
    try:
        threshold_index = next(
            (i for i, t in enumerate(MOCK_THRESHOLDS) if t["id"] == threshold_id), 
            None
        )
        if threshold_index is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Threshold not found"
            )
        
        deleted_threshold = MOCK_THRESHOLDS.pop(threshold_index)
        return {"message": "Threshold deleted successfully", "deleted": deleted_threshold}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting threshold {threshold_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting threshold"
        )
