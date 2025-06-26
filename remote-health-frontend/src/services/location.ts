import { API_URL } from '../config';
import { Location } from '../types/location';

const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const locationService = {
  async getAllLocations(): Promise<Location[]> {
    const response = await fetch(`${API_URL}/locations`, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch locations');
    return response.json();
  },

  async getPatientLocation(patientId: number): Promise<Location> {
    const response = await fetch(`${API_URL}/patients/${patientId}/location`, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch patient location');
    return response.json();
  },

  async updateLocation(patientId: number, data: Partial<Location>): Promise<Location> {
    const response = await fetch(`${API_URL}/patients/${patientId}/location`, {
      method: 'PUT',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update location');
    return response.json();
  },

  async deleteLocation(patientId: number): Promise<void> {
    const response = await fetch(`${API_URL}/patients/${patientId}/location`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to delete location');
  },
}; 