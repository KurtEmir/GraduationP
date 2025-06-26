import { API_URL } from '../config';
import { Patient, VitalSigns } from '../types/patient';

const getAuthHeader = (): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const patientService = {
    async getAllPatients(): Promise<Patient[]> {
        const response = await fetch(`${API_URL}/patient-records`, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json',
            }
        });
        if (!response.ok) throw new Error('Failed to fetch patients');
        return response.json();
    },

    async getPatient(id: number): Promise<Patient> {
        const response = await fetch(`${API_URL}/patient-records/${id}`, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json',
            }
        });
        if (!response.ok) throw new Error('Failed to fetch patient');
        return response.json();
    },

    async getCurrentPatientProfile(): Promise<Patient | null> {
        // Only call this endpoint if the user is a patient (from AuthContext if available)
        let userRole = null;
        // Try to get from window.__USER__ (if set by AuthContext)
        if (typeof window !== 'undefined' && (window as any).__USER__ && (window as any).__USER__.role) {
            userRole = (window as any).__USER__.role;
        } else {
            // Fallback to localStorage
            const userStr = localStorage.getItem('user');
            try {
                const user = userStr ? JSON.parse(userStr) : null;
                userRole = user?.role;
            } catch (e) {
                userRole = null;
            }
        }
        if (userRole !== 'PATIENT') {
            // Not a patient, don't call the endpoint at all
            return null;
        }
        try {
            const response = await fetch(`${API_URL}/patient-records/me`, {
                headers: {
                    ...getAuthHeader(),
                    'Content-Type': 'application/json',
                }
            });
            if (response.status === 404 || response.status === 422) {
                // Silently return null for 404/422 - this is expected for doctor users
                return null;
            }
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch current patient profile' }));
                console.error(`patientService.getCurrentPatientProfile: Error - Status ${response.status}`, errorData);
                throw new Error(errorData.detail || 'Failed to fetch current patient profile');
            }
            return response.json();
        } catch (error) {
            // Network or unexpected error
            console.error('patientService.getCurrentPatientProfile: Network or unexpected error', error);
            return null;
        }
    },

    async updatePatient(id: number, data: Partial<Patient>): Promise<Patient> {
        const response = await fetch(`${API_URL}/patient-records/${id}`, {
            method: 'PUT',
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update patient');
        return response.json();
    },

    async addVitalSigns(patientId: number, vitals: VitalSigns): Promise<VitalSigns> {
        const response = await fetch(`${API_URL}/patient-records/${patientId}/vitals`, {
            method: 'POST',
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(vitals)
        });
        if (!response.ok) throw new Error('Failed to add vital signs');
        return response.json();
    },

    async getVitalSigns(patientId: number): Promise<VitalSigns[]> {
        console.log(`Attempting to fetch vital signs for patient ID ${patientId}`);
        
        // Try the primary endpoint with trailing slash (RESTful convention)
        const primaryUrl = `${API_URL}/patient-records/${patientId}/vitals/`;
        console.log(`Trying primary endpoint: ${primaryUrl}`);
        
        try {
            const response = await fetch(primaryUrl, {
                headers: {
                    ...getAuthHeader(),
                    'Content-Type': 'application/json',
                },
            });
            
            if (response.ok) {
                console.log('Successfully fetched vital signs from primary endpoint');
                return response.json();
            }
            
            console.warn(`Primary endpoint failed with status: ${response.status}. Trying without trailing slash.`);
            
            // Try without trailing slash
            const secondaryUrl = `${API_URL}/patient-records/${patientId}/vitals`;
            console.log(`Trying secondary endpoint: ${secondaryUrl}`);
            
            const secondResponse = await fetch(secondaryUrl, {
                headers: {
                    ...getAuthHeader(),
                    'Content-Type': 'application/json',
                },
            });
            
            if (secondResponse.ok) {
                console.log('Successfully fetched vital signs from secondary endpoint');
                return secondResponse.json();
            }
            
            console.warn(`Secondary endpoint failed with status: ${secondResponse.status}. Trying legacy endpoint.`);
            
            // Try legacy endpoint mentioned in API docs
            const legacyUrl = `${API_URL}/patients/${patientId}/vitals`;
            console.log(`Trying legacy endpoint: ${legacyUrl}`);
            
            const legacyResponse = await fetch(legacyUrl, {
                headers: {
                    ...getAuthHeader(),
                    'Content-Type': 'application/json',
                },
            });
            
            if (legacyResponse.ok) {
                console.log('Successfully fetched vital signs from legacy endpoint');
                return legacyResponse.json();
            }
            
            // If all attempts fail, throw error with details
            console.error(`All vital signs endpoints failed. Last status: ${legacyResponse.status}`);
            const errorBody = await legacyResponse.text();
            throw new Error(`Failed to fetch vital signs (${legacyResponse.status}): ${errorBody}`);
        } catch (error) {
            console.error('Error fetching vital signs:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to fetch vital signs');
        }
    },

    async deletePatient(id: number): Promise<void> {
        const response = await fetch(`${API_URL}/patient-records/${id}`, {
            method: 'DELETE',
            headers: getAuthHeader(),
        });
        if (!response.ok) throw new Error('Failed to delete patient');
    },

    async createPatient(data: Omit<Patient, 'id' | 'user_id' | 'role' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Patient> {
        const response = await fetch(`${API_URL}/patient-records`, {
            method: 'POST',
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Failed to create patient' }));
            throw new Error(errorData.detail || 'Failed to create patient');
        }
        return response.json();
    },

    getLiveFakeVitals(): VitalSigns {
        // Generate realistic fake vital signs with some variation
        const baseHeartRate = 70;
        const baseTemperature = 36.5;
        const baseSpO2 = 98;
        const baseSystolic = 120;
        const baseDiastolic = 80;
        
        return {
            heartRate: Math.round(baseHeartRate + (Math.random() - 0.5) * 20),
            temperature: Math.round((baseTemperature + (Math.random() - 0.5) * 2) * 10) / 10,
            oxygenSaturation: Math.round(baseSpO2 + (Math.random() - 0.5) * 4),
            systolic: Math.round(baseSystolic + (Math.random() - 0.5) * 30),
            diastolic: Math.round(baseDiastolic + (Math.random() - 0.5) * 20),
            pulse: Math.round(baseHeartRate + (Math.random() - 0.5) * 15),
            timestamp: new Date().toISOString()
        };
    },

    async getVitalSignsActivityStats(): Promise<{ month: string; count: number }[]> {
        // Simulate API call to get aggregated vital signs activity
        // console.log('Fetching vital signs activity stats...');
        // await new Promise(resolve => setTimeout(resolve, 700)); // Simulate network delay

        // const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        // const currentMonth = new Date().getMonth(); // 0-11
        
        // // Generate mock data for the last 6 months including current month
        // const activity = [];
        // for (let i = 5; i >= 0; i--) {
        //     const monthIndex = (currentMonth - i + 12) % 12;
        //     activity.push({
        //         month: months[monthIndex],
        //         // Random count between 50 and 200 for demonstration
        //         count: Math.floor(Math.random() * 151) + 50 
        //     });
        // }
        // console.log('Returning mock vital signs activity:', activity);
        // return activity;
        const response = await fetch(`${API_URL}/patient-records/vital-signs/stats`, { // Assuming this is the endpoint
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            console.error('Failed to fetch vital signs activity stats');
            throw new Error('Failed to fetch vital signs activity stats');
        }
        return response.json();
    },

    async pairWithDoctor(doctor_code: string): Promise<any> {
        const response = await fetch(`${API_URL}/pair/pair-with-doctor`, {
            method: 'POST',
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ doctor_code }),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Failed to pair with doctor' }));
            throw new Error(errorData.detail);
        }
        return response.json();
    },

    async getDoctorPatients(): Promise<Patient[]> {
        const response = await fetch(`${API_URL}/doctors/me/patients`, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch doctor patients');
        }
        return response.json();
    }
};