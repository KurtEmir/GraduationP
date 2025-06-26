"""
API endpoints for managing fake data generation for the Remote Health Monitoring System.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Dict, List, Optional, Any

from app.api import deps
from app.models import User
from app.models.user_model import UserRole
from app.services import data_generator
from app.crud import patients as crud_patients

router = APIRouter()


# Data models for the API
class SimulationPatientConfig(BaseModel):
    patient_id: int
    interval_seconds: Optional[int] = 60
    patterns: Optional[List[str]] = ["diurnal"]


class SimulationConfig(BaseModel):
    patients: List[SimulationPatientConfig]


class SimulationStatus(BaseModel):
    is_running: bool
    patient_count: int
    patients: List[Dict[str, Any]]


@router.post("/start", response_model=dict, status_code=status.HTTP_200_OK)
def start_simulation(
    config: Optional[SimulationConfig] = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Start the fake data generation simulation.
    
    Args:
        config: Optional configuration for the simulation
    
    Returns:
        Status of the operation
    """
    # Only superusers and doctors can control the simulation
    if not (current_user.is_superuser or current_user.role == UserRole.DOCTOR):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superusers and doctors can control the data simulation",
        )
    
    # Start the generator service
    success = data_generator.start_data_generator()
    if not success:
        return {"message": "Simulation was already running"}
    
    # If configuration is provided, add the specified patients
    if config:
        for patient_config in config.patients:
            # Verify that the patient exists
            patient_profile = crud_patients.get_by_user_id(db, user_id=patient_config.patient_id)
            if not patient_profile:
                continue  # Skip non-existent patients
            
            # Add patient to simulation
            data_generator.add_patient_to_simulation(
                patient_id=patient_config.patient_id,
                interval_seconds=patient_config.interval_seconds,
                patterns=patient_config.patterns,
            )
    
    return {"message": "Simulation started successfully"}


@router.post("/stop", response_model=dict, status_code=status.HTTP_200_OK)
def stop_simulation(
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Stop the fake data generation simulation.
    
    Returns:
        Status of the operation
    """
    # Only superusers and doctors can control the simulation
    if not (current_user.is_superuser or current_user.role == UserRole.DOCTOR):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superusers and doctors can control the data simulation",
        )
    
    # Stop the generator service
    success = data_generator.stop_data_generator()
    if not success:
        return {"message": "Simulation was not running"}
    
    return {"message": "Simulation stopped successfully"}


@router.get("/status", response_model=SimulationStatus, status_code=status.HTTP_200_OK)
def get_simulation_status(
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Get the current status of the data generation simulation.
    
    Returns:
        Current simulation status
    """
    # Only superusers and doctors can view simulation status
    if not (current_user.is_superuser or current_user.role == UserRole.DOCTOR):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superusers and doctors can view simulation status",
        )
    
    return data_generator.get_simulation_status()


@router.post("/patients/add", response_model=dict, status_code=status.HTTP_200_OK)
def add_patient_to_simulation(
    patient_config: SimulationPatientConfig,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Add a patient to the data generation simulation.
    
    Args:
        patient_config: Configuration for the patient simulation
    
    Returns:
        Status of the operation
    """
    # Only superusers and doctors can control the simulation
    if not (current_user.is_superuser or current_user.role == UserRole.DOCTOR):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superusers and doctors can control the data simulation",
        )
    
    # Verify that the simulation is running
    if not data_generator.is_running:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Simulation is not running, start it first",
        )
    
    # Verify that the patient exists
    patient_profile = crud_patients.get_by_user_id(db, user_id=patient_config.patient_id)
    if not patient_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_config.patient_id} not found",
        )
    
    # Add patient to simulation
    success = data_generator.add_patient_to_simulation(
        patient_id=patient_config.patient_id,
        interval_seconds=patient_config.interval_seconds,
        patterns=patient_config.patterns,
    )
    
    if success:
        return {
            "message": f"Patient {patient_config.patient_id} added to simulation successfully",
            "patient_id": patient_config.patient_id
        }
    else:
        return {
            "message": f"Patient {patient_config.patient_id} was already in the simulation",
            "patient_id": patient_config.patient_id
        }


@router.delete("/patients/{patient_id}", response_model=dict, status_code=status.HTTP_200_OK)
def remove_patient_from_simulation(
    patient_id: int,
    current_user: User = Depends(deps.get_current_active_user),
):
    """
    Remove a patient from the data generation simulation.
    
    Args:
        patient_id: ID of the patient to remove
    
    Returns:
        Status of the operation
    """
    # Only superusers and doctors can control the simulation
    if not (current_user.is_superuser or current_user.role == UserRole.DOCTOR):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superusers and doctors can control the data simulation",
        )
    
    # Verify that the simulation is running
    if not data_generator.is_running:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Simulation is not running",
        )
    
    # Remove patient from simulation
    success = data_generator.remove_patient_from_simulation(patient_id)
    
    if success:
        return {
            "message": f"Patient {patient_id} removed from simulation successfully",
            "patient_id": patient_id
        }
    else:
        return {
            "message": f"Patient {patient_id} was not in the simulation",
            "patient_id": patient_id
        }


@router.post("/quick-start", response_model=dict, status_code=status.HTTP_200_OK)
def quick_start_simulation(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    interval_seconds: int = 30,  # Generate data every 30 seconds by default
    max_patients: int = 5,  # Limit to 5 patients by default for performance
):
    """
    Quick start the simulation with all available patients (up to max_patients).
    
    Args:
        interval_seconds: How often to generate data per patient
        max_patients: Maximum number of patients to simulate
    
    Returns:
        Status of the operation with patient IDs added
    """
    # Only superusers and doctors can control the simulation
    if not (current_user.is_superuser or current_user.role == UserRole.DOCTOR):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superusers and doctors can control the data simulation",
        )
    
    # Start the generator service if not already running
    if not data_generator.is_running:
        data_generator.start_data_generator()
    
    # Get all patient profiles
    patients = crud_patients.get_multi(db, limit=max_patients)
    added_count = 0
    added_patients = []
    
    # Add each patient to the simulation
    for patient in patients:
        if added_count >= max_patients:
            break
            
        success = data_generator.add_patient_to_simulation(
            patient_id=patient.user_id,
            interval_seconds=interval_seconds,
            patterns=["diurnal", "exercise"] if added_count % 2 == 0 else ["diurnal"],
        )
        
        if success:
            added_count += 1
            added_patients.append(patient.user_id)
    
    return {
        "message": f"Simulation quick-started with {added_count} patients",
        "patients_added": added_patients,
        "interval_seconds": interval_seconds
    }
