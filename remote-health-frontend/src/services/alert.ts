import { API_URL } from '../config';
import { Alert } from '../types/alert';

const getAuthHeader = (): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const alertService = {
    async getAllAlerts(): Promise<Alert[]> {
        const response = await fetch(`${API_URL}/alerts`, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) throw new Error('Failed to fetch alerts');
        return response.json();
    },

    async getPatientAlerts(patientId: number): Promise<Alert[]> {
        const response = await fetch(`${API_URL}/patients/${patientId}/alerts`, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) throw new Error('Failed to fetch patient alerts');
        return response.json();
    },

    async createAlert(patientId: number, data: Omit<Alert, 'id' | 'patientId' | 'timestamp'>): Promise<Alert> {
        const response = await fetch(`${API_URL}/alerts`, {
            method: 'POST',
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...data, patientId }),
        });
        if (!response.ok) throw new Error('Failed to create alert');
        return response.json();
    },

    async updateAlert(id: number, data: Partial<Alert>): Promise<Alert> {
        const response = await fetch(`${API_URL}/alerts/${id}`, {
            method: 'PUT',
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update alert');
        return response.json();
    },

    async deleteAlert(id: number): Promise<void> {
        const response = await fetch(`${API_URL}/alerts/${id}`, {
            method: 'DELETE',
            headers: getAuthHeader(),
        });
        if (!response.ok) throw new Error('Failed to delete alert');
    },
}; 