// Assuming VitalSigns is already defined appropriately on the frontend
// And VitalsList matches the backend structure: { vitals: VitalSigns[], total: number }

async getVitalSigns(patientId: number, skip: number = 0, limit: number = 100): Promise<VitalsList> {
    const response = await fetch(`${API_URL}/vitals/${patientId}?skip=${skip}&limit=${limit}`, { // Corrected URL and added pagination params
        headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        // Consider more specific error handling based on status codes
        throw new Error('Failed to fetch vital signs');
    }
    return response.json(); // Expects { vitals: VitalSigns[], total: number }
}

async getCurrentPatientVitalSigns(skip: number = 0, limit: number = 100): Promise<VitalsList> {
    const response = await fetch(`${API_URL}/vitals/me?skip=${skip}&limit=${limit}`, { // Endpoint for patient's own vitals
        headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        // Consider more specific error handling
        throw new Error('Failed to fetch current patient\'s vital signs');
    }
    return response.json(); // Expects { vitals: VitalSigns[], total: number }
}

async getCurrentPatientProfile(): Promise<Patient | null> {
    const response = await fetch(`${API_URL}/patients/me`, {
        headers: {
            ...getAuthHeader(), // Sends 'Authorization: Bearer {token}'
            // 'Content-Type': 'application/json', // Not strictly necessary for GET, but harmless
        }
    });
    if (response.status === 404) { // Keep 404 handling for profile not found
        console.log(`patientService.getCurrentPatientProfile: Received 404, profile not found.`);
        return null;
    }
    if (response.status === 422) { // Keep 422 handling, but investigate backend
        console.error(`patientService.getCurrentPatientProfile: Received 422 Unprocessable Entity. Check JWT token and backend logs.`);
        // Depending on UX, you might still return null or throw a more specific error
        return null; 
    }
    if (!response.ok) {
        console.error(`patientService.getCurrentPatientProfile: Error fetching profile - ${response.status} ${response.statusText}`);
        // Consider throwing an error or returning null based on how you want to handle other errors
        throw new Error(`Failed to fetch patient profile: ${response.status}`);
    }
    return response.json();
} 