#!/usr/bin/env python3
"""
Simple script to create a basic admin user for testing the backend
"""
import sys
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app import crud
from app.schemas.user import UserCreate
from app.models.user_model import UserRole

def create_basic_user():
    db = SessionLocal()
    try:
        # Check if admin user already exists
        admin_user = crud.user.get_by_email(db, email="admin@example.com")
        if admin_user:
            print(f"Admin user already exists: {admin_user.email}")
            return
        
        # Create admin user
        user_in = UserCreate(
            email="admin@example.com",
            password="admin123",
            first_name="Admin",
            last_name="User",
            role=UserRole.ADMIN
        )
        admin_user = crud.user.create(db, obj_in=user_in)
        print(f"Created admin user: {admin_user.email} with ID: {admin_user.id}")
        
        # Create basic patient user
        patient_user = crud.user.get_by_email(db, email="patient@example.com")
        if not patient_user:
            patient_in = UserCreate(
                email="patient@example.com",
                password="patient123", 
                first_name="John",
                last_name="Doe",
                role=UserRole.PATIENT
            )
            patient_user = crud.user.create(db, obj_in=patient_in)
            print(f"Created patient user: {patient_user.email} with ID: {patient_user.id}")
        else:
            print(f"Patient user already exists: {patient_user.email}")
            
    except Exception as e:
        print(f"Error creating users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_basic_user()
