"""
Fake Live Data Generator for Remote Health Monitoring System.

This module provides a mechanism to generate realistic vital sign data
for patients in the system, simulating a real-world health monitoring scenario.
"""

import asyncio
import logging
import random
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.crud import vitals as crud_vitals
from app.crud import patients as crud_patients
from app.models import User
from app.models.domain_models import DataSource
from app.schemas.patient import VitalsCreate
from app.db.session import SessionLocal

logger = logging.getLogger(__name__)

# Global state tracking for the data generator service
generator_task = None
is_running = False
patients_to_simulate = {}  # Dict to store patient IDs and their simulation parameters


class VitalSignSimulator:
    """Class to simulate vital signs for patients."""
    
    # Define normal ranges for vital signs
    NORMAL_RANGES = {
        # (min, max, decimal places)
        "heart_rate": (60, 80, 0),
        "temperature": (36.5, 37.0, 1),
        "spo2": (95, 99, 0),
        "systolic": (110, 130, 0),
        "diastolic": (70, 85, 0),
        "pulse": (60, 80, 0),
    }

    # Define anomaly probabilities and ranges
    ANOMALY_PROBABILITY = 0.03  # 3% chance of anomaly per reading
    ANOMALY_RANGES = {
        "heart_rate": [(40, 55), (100, 130)],  # Too low or too high
        "temperature": [(35.0, 36.0), (37.5, 39.0)],  # Too low or too high
        "spo2": [(88, 94)],  # Only low is concerning
        "systolic": [(90, 105), (140, 180)],
        "diastolic": [(50, 65), (90, 110)],
        "pulse": [(40, 55), (100, 130)],
    }
    
    # Patient-specific pattern configurations
    PATIENT_PATTERNS = {
        # Define patterns like diurnal variations, trending values, etc.
        "diurnal": {
            "heart_rate": 10,  # Higher during day, +/- this amount
            "temperature": 0.3,
        },
        "exercise": {
            "heart_rate": 30,  # Spike during exercise periods
            "spo2": -2,  # Slight decrease
            "systolic": 20,
            "diastolic": 10,
        },
    }
    
    def __init__(self, patient_id: int, patterns: List[str] = None):
        """
        Initialize a vital sign simulator for a specific patient.
        
        Args:
            patient_id: The ID of the patient to simulate
            patterns: List of patterns to apply (e.g., ["diurnal", "exercise"])
        """
        self.patient_id = patient_id
        self.patterns = patterns or []
        self.last_generation_time = None
        
    def generate_reading(self) -> Dict[str, float]:
        """Generate a set of vital signs readings based on time and patterns."""
        current_time = datetime.now()
        
        # Initialize with base values in normal range
        readings = {}
        for vital, (min_val, max_val, decimal) in self.NORMAL_RANGES.items():
            base_value = round(random.uniform(min_val, max_val), decimal)
            readings[vital] = base_value
        
        # Apply patterns
        self._apply_patterns(readings, current_time)
        
        # Possibly generate an anomaly
        if random.random() < self.ANOMALY_PROBABILITY:
            self._generate_anomaly(readings)
        
        # Store the generation time
        self.last_generation_time = current_time
        return readings
    
    def _apply_patterns(self, readings: Dict[str, float], current_time: datetime) -> None:
        """Apply defined patterns to the readings."""
        for pattern in self.patterns:
            if pattern == "diurnal":
                # Simulate diurnal variation (time of day effects)
                hour = current_time.hour
                # Higher values during waking hours (8am-10pm)
                day_factor = 1.0 if 8 <= hour <= 22 else -1.0
                
                for vital, variation in self.PATIENT_PATTERNS["diurnal"].items():
                    if vital in readings:
                        readings[vital] += day_factor * random.uniform(0, variation)
            
            elif pattern == "exercise":
                # Simulate occasional exercise periods (10% chance)
                if random.random() < 0.1:
                    for vital, change in self.PATIENT_PATTERNS["exercise"].items():
                        if vital in readings:
                            readings[vital] += change
        
        # Round the values to appropriate decimal places
        for vital in readings:
            if vital in self.NORMAL_RANGES:
                readings[vital] = round(readings[vital], self.NORMAL_RANGES[vital][2])
    
    def _generate_anomaly(self, readings: Dict[str, float]) -> None:
        """Generate an anomaly in one of the vital signs."""
        # Choose which vital to create an anomaly for
        vital = random.choice(list(self.ANOMALY_RANGES.keys()))
        
        # Choose one of the anomaly ranges for this vital
        anomaly_range = random.choice(self.ANOMALY_RANGES[vital])
        
        # Set the value within the anomaly range
        readings[vital] = round(
            random.uniform(anomaly_range[0], anomaly_range[1]), 
            self.NORMAL_RANGES[vital][2]
        )
        
        logger.info(f"Generated anomaly for patient {self.patient_id}: {vital}={readings[vital]}")


async def generate_data_for_patient(patient_id: int, 
                                   interval_seconds: int = 60,
                                   patterns: List[str] = None) -> None:
    """
    Generate data periodically for a specific patient.
    
    Args:
        patient_id: The ID of the patient to generate data for
        interval_seconds: How often to generate data (in seconds)
        patterns: List of patterns to apply to this patient's data
    """
    simulator = VitalSignSimulator(patient_id, patterns)
    
    while is_running and patient_id in patients_to_simulate:
        try:
            # Generate the vital signs
            vitals_data = simulator.generate_reading()
            
            # Create a database session
            db = SessionLocal()
            try:
                # Create the vitals record
                vitals_create = VitalsCreate(
                    heart_rate=vitals_data["heart_rate"],
                    temperature=vitals_data["temperature"],
                    spo2=vitals_data["spo2"],
                    systolic=vitals_data["systolic"],
                    diastolic=vitals_data["diastolic"],
                    pulse=vitals_data["pulse"],
                    source=DataSource.SIMULATED.value
                )
                
                # Save to database
                # crud_vitals.create_with_patient(db, obj_in=vitals_create, patient_id=patient_id)
                # Use the new centralized function that includes anomaly checks
                crud_vitals.vitals.create_and_check(db, obj_in=vitals_create, patient_id=patient_id)

                logger.info(f"Generated and checked vital signs for patient {patient_id}")
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error generating data for patient {patient_id}: {str(e)}")
        
        # Wait for the next interval
        await asyncio.sleep(interval_seconds)


async def data_generator_service() -> None:
    """Main service function that manages data generation for all patients."""
    logger.info("Starting fake data generator service")
    
    while is_running:
        # Start tasks for any new patients
        for patient_id, config in patients_to_simulate.items():
            # Create and schedule the task if not already running
            asyncio.create_task(
                generate_data_for_patient(
                    patient_id=patient_id,
                    interval_seconds=config.get("interval_seconds", 60),
                    patterns=config.get("patterns", ["diurnal"])
                )
            )
        
        # Check every 5 seconds for changes in the patients list
        await asyncio.sleep(5)
    
    logger.info("Fake data generator service stopped")


def start_data_generator() -> bool:
    """Start the data generator service."""
    global generator_task, is_running
    
    if is_running:
        logger.warning("Data generator service is already running")
        return False
    
    is_running = True
    generator_task = asyncio.create_task(data_generator_service())
    logger.info("Data generator service started")
    return True


def stop_data_generator() -> bool:
    """Stop the data generator service."""
    global is_running, generator_task, patients_to_simulate
    
    if not is_running:
        logger.warning("Data generator service is not running")
        return False
    
    is_running = False
    patients_to_simulate = {}
    
    # Task will end by itself due to the is_running flag
    logger.info("Data generator service stopping")
    return True


def add_patient_to_simulation(patient_id: int, 
                             interval_seconds: int = 60,
                             patterns: List[str] = None) -> bool:
    """
    Add a patient to the simulation.
    
    Args:
        patient_id: The ID of the patient to add
        interval_seconds: How often to generate data (in seconds)
        patterns: List of patterns to apply to this patient's data
    
    Returns:
        True if the patient was successfully added, False otherwise
    """
    if patient_id in patients_to_simulate:
        logger.warning(f"Patient {patient_id} is already being simulated")
        return False
    
    patients_to_simulate[patient_id] = {
        "interval_seconds": interval_seconds,
        "patterns": patterns or ["diurnal"],
        "start_time": datetime.now(),
    }
    
    logger.info(f"Added patient {patient_id} to simulation with interval {interval_seconds}s")
    return True


def remove_patient_from_simulation(patient_id: int) -> bool:
    """
    Remove a patient from the simulation.
    
    Args:
        patient_id: The ID of the patient to remove
    
    Returns:
        True if the patient was successfully removed, False otherwise
    """
    if patient_id not in patients_to_simulate:
        logger.warning(f"Patient {patient_id} is not being simulated")
        return False
    
    del patients_to_simulate[patient_id]
    logger.info(f"Removed patient {patient_id} from simulation")
    return True


def get_simulation_status() -> Dict:
    """
    Get the current status of the data generator simulation.
    
    Returns:
        Dict containing status information
    """
    return {
        "is_running": is_running,
        "patient_count": len(patients_to_simulate),
        "patients": [
            {
                "id": patient_id,
                "config": config,
                "running_time": str(datetime.now() - config["start_time"]) if "start_time" in config else "N/A"
            }
            for patient_id, config in patients_to_simulate.items()
        ]
    }
