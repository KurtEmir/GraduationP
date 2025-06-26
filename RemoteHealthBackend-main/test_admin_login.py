#!/usr/bin/env python3
import requests
import json

# Test the admin login
def test_admin_login():
    try:
        login_url = "http://localhost:8000/api/v1/auth/login"
        login_data = {
            "username": "admin@example.com",
            "password": "admin123"
        }
        
        print("Testing admin login...")
        response = requests.post(login_url, data=login_data)
        print(f"Login response status: {response.status_code}")
        
        if response.status_code == 200:
            token_data = response.json()
            print(f"Login successful! Response: {token_data}")
            
            # Handle different possible token formats
            access_token = token_data.get('access_token') or token_data.get('token')
            if not access_token:
                print(f"No access token found in response: {token_data}")
                return
                
            print(f"Token: {access_token[:50]}...")
            print(f"User role: {token_data.get('user', {}).get('role', 'Unknown')}")
            
            # Test accessing patient records
            headers = {"Authorization": f"Bearer {access_token}"}
            
            patient_records_url = "http://localhost:8000/api/v1/patient-records/"
            print("\nTesting patient records access...")
            records_response = requests.get(patient_records_url, headers=headers)
            print(f"Patient records response status: {records_response.status_code}")
            
            if records_response.status_code == 200:
                records = records_response.json()
                print(f"Patient records retrieved successfully! Count: {len(records)}")
                if records:
                    print(f"First patient: {records[0]['full_name']} ({records[0]['email']})")
            else:
                print(f"Error accessing patient records: {records_response.text}")
        else:
            print(f"Login failed: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

# Test doctor login
def test_doctor_login():
    try:
        login_url = "http://localhost:8000/api/v1/auth/login"
        login_data = {
            "username": "doctor@example.com",
            "password": "doctor123"
        }
        
        print("\nTesting doctor login...")
        response = requests.post(login_url, data=login_data)
        print(f"Login response status: {response.status_code}")
        
        if response.status_code == 200:
            token_data = response.json()
            print(f"Login successful! Response: {token_data}")
            
            # Handle different possible token formats
            access_token = token_data.get('access_token') or token_data.get('token')
            if not access_token:
                print(f"No access token found in response: {token_data}")
                return
                
            print(f"Token: {access_token[:50]}...")
            print(f"User role: {token_data.get('user', {}).get('role', 'Unknown')}")
            
            # Test accessing alerts
            headers = {"Authorization": f"Bearer {access_token}"}
            
            alerts_url = "http://localhost:8000/api/v1/alerts/"
            print("\nTesting alerts access...")
            alerts_response = requests.get(alerts_url, headers=headers)
            print(f"Alerts response status: {alerts_response.status_code}")
            
            if alerts_response.status_code == 200:
                alerts = alerts_response.json()
                print(f"Alerts retrieved successfully! Count: {len(alerts)}")
            else:
                print(f"Error accessing alerts: {alerts_response.text}")
                
            # Test accessing patient records
            patient_records_url = "http://localhost:8000/api/v1/patient-records/"
            print("\nTesting patient records access...")
            records_response = requests.get(patient_records_url, headers=headers)
            print(f"Patient records response status: {records_response.status_code}")
            
            if records_response.status_code == 200:
                records = records_response.json()
                print(f"Patient records retrieved successfully! Count: {len(records)}")
            else:
                print(f"Error accessing patient records: {records_response.text}")
        else:
            print(f"Login failed: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_admin_login()
    test_doctor_login()
