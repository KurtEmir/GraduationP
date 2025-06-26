import { API_URL } from '../config';
import { DiseaseThreshold } from '../types/thresholds';

const getAuthHeader = (): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Mock data for development purposes
const MOCK_THRESHOLDS: DiseaseThreshold[] = [
    {
        id: 1,
        disease: 'Normal',
        heart_rate_min: 60,
        heart_rate_max: 100,
        temperature_min: 36.1,
        temperature_max: 37.2,
        spo2_min: 95,
        spo2_max: 100,
        systolic_bp_min: 90,
        systolic_bp_max: 120,
        diastolic_bp_min: 60,
        diastolic_bp_max: 80
    },
    {
        id: 2,
        disease: 'Hypertension',
        heart_rate_min: 60,
        heart_rate_max: 100,
        temperature_min: 36.1,
        temperature_max: 37.2,
        spo2_min: 95,
        spo2_max: 100,
        systolic_bp_min: 140,
        systolic_bp_max: 180,
        diastolic_bp_min: 90,
        diastolic_bp_max: 120
    },
    {
        id: 3,
        disease: 'Hypotension',
        heart_rate_min: 60,
        heart_rate_max: 100,
        temperature_min: 36.1,
        temperature_max: 37.2,
        spo2_min: 95,
        spo2_max: 100,
        systolic_bp_min: 70,
        systolic_bp_max: 90,
        diastolic_bp_min: 40,
        diastolic_bp_max: 60
    },
    {
        id: 4,
        disease: 'Fever',
        heart_rate_min: 100,
        heart_rate_max: 130,
        temperature_min: 38.0,
        temperature_max: 41.0,
        spo2_min: 95,
        spo2_max: 100,
        systolic_bp_min: 90,
        systolic_bp_max: 120,
        diastolic_bp_min: 60,
        diastolic_bp_max: 80
    },
    {
        id: 5,
        disease: 'Hypoxemia',
        heart_rate_min: 60,
        heart_rate_max: 100,
        temperature_min: 36.1,
        temperature_max: 37.2,
        spo2_min: 85,
        spo2_max: 94,
        systolic_bp_min: 90,
        systolic_bp_max: 120,
        diastolic_bp_min: 60,
        diastolic_bp_max: 80
    },
    {
        id: 6,
        disease: 'Tachycardia',
        heart_rate_min: 101,
        heart_rate_max: 150,
        temperature_min: 36.1,
        temperature_max: 37.2,
        spo2_min: 95,
        spo2_max: 100,
        systolic_bp_min: 90,
        systolic_bp_max: 120,
        diastolic_bp_min: 60,
        diastolic_bp_max: 80
    },
    {
        id: 7,
        disease: 'Bradycardia',
        heart_rate_min: 40,
        heart_rate_max: 59,
        temperature_min: 36.1,
        temperature_max: 37.2,
        spo2_min: 95,
        spo2_max: 100,
        systolic_bp_min: 90,
        systolic_bp_max: 120,
        diastolic_bp_min: 60,
        diastolic_bp_max: 80
    }
];

export const thresholdService = {
    async getAllThresholds(): Promise<DiseaseThreshold[]> {
        try {
            // First try the API endpoint
            const response = await fetch(`${API_URL}/disease-thresholds`, {
                headers: {
                    ...getAuthHeader(),
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                console.log("getAllThresholds: Successfully fetched from API");
                return response.json();
            }
            
            console.log("getAllThresholds: API endpoint not available, using mock data");
            return MOCK_THRESHOLDS;
        } catch (error) {
            console.log("getAllThresholds: Network error, using mock data");
            return MOCK_THRESHOLDS;
        }
    },

    async getThresholdById(id: number): Promise<DiseaseThreshold | undefined> {
        try {
            const response = await fetch(`${API_URL}/disease-thresholds/${id}`, {
                headers: {
                    ...getAuthHeader(),
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                return response.json();
            }
            
            // Return mock data for the given ID
            return MOCK_THRESHOLDS.find(t => t.id === id);
        } catch (error) {
            console.error(`Error fetching threshold with ID ${id}:`, error);
            return MOCK_THRESHOLDS.find(t => t.id === id);
        }
    }
}; 