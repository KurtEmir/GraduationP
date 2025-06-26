#!/usr/bin/env python3

import requests
import json
from pprint import pprint

# Configuration
BASE_URL = "http://localhost:8000"
LOGIN_URL = f"{BASE_URL}/api/v1/auth/login"
VITAL_SIGNS_STATS_URL = f"{BASE_URL}/api/v1/patient-records/vital-signs/stats"

def test_vital_signs_stats():
    """Test the vital signs activity stats endpoint"""
    
    # Test with doctor login
    print("=== Testing Vital Signs Activity Stats Endpoint ===")
    
    # Login as doctor (test different credentials)
    doctor_data = {
        "username": "doctor@example.com",
        "password": "doctor123"
    }
    
    print(f"Logging in as doctor...")
    login_response = requests.post(LOGIN_URL, data=doctor_data)
    
    if login_response.status_code != 200:
        print(f"❌ Admin login failed: {login_response.status_code}")
        print(f"Response: {login_response.text}")
        return
    
    login_result = login_response.json()
    print(f"✅ Admin login successful!")
    print(f"Login response keys: {login_result.keys()}")
    print(f"User role: {login_result.get('user', {}).get('role', 'Unknown')}")
    
    # Get access token (handle different response formats)
    access_token = login_result.get("access_token") or login_result.get("token")
    if not access_token:
        print(f"❌ No access token found in response: {login_result}")
        return
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Test vital signs stats endpoint
    print(f"\nTesting vital signs activity stats endpoint...")
    response = requests.get(VITAL_SIGNS_STATS_URL, headers=headers)
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Success! Response data:")
        pprint(data)
        
        # Validate the format
        if isinstance(data, list):
            print(f"\n✅ Data is a list with {len(data)} items")
            
            # Check if all items have correct format
            valid_format = True
            for item in data:
                if not isinstance(item, dict) or 'month' not in item or 'count' not in item:
                    valid_format = False
                    break
            
            if valid_format:
                print("✅ All items have correct format with 'month' and 'count' fields")
            else:
                print("❌ Some items don't have the expected format")
        else:
            print("❌ Response is not a list")
    else:
        print(f"❌ Request failed: {response.status_code}")
        print(f"Response: {response.text}")

if __name__ == "__main__":
    test_vital_signs_stats()
