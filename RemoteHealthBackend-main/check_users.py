#!/usr/bin/env python3

import sqlite3
import os

# Database path
db_path = "c:/Users/aleyn/Graduation/RemoteHealthBackend-main/remote_health.db"

def check_users():
    """Check what users exist in the database"""
    
    if not os.path.exists(db_path):
        print(f"❌ Database file not found: {db_path}")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check users table
        cursor.execute("SELECT id, email, role, is_active FROM users")
        users = cursor.fetchall()
        
        print("=== Users in Database ===")
        for user in users:
            user_id, email, role, is_active = user
            print(f"ID: {user_id}, Email: {email}, Role: {role}, Active: {bool(is_active)}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error checking users: {e}")

if __name__ == "__main__":
    check_users()
