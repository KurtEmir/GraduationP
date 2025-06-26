import { API_URL } from '../config'; // Ensure API_URL is imported
import { Alert } from '../types/alert';

// const MOCK_ALERTS: Alert[] = [
//   {
//     id: 1,
//     patientId: 1, 
//     type: 'CRITICAL',
//     message: 'Heart rate significantly above normal range (180 bpm).',
//     timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
//     status: 'ACTIVE',
//     metadata: { vital: 'Heart Rate', value: '180 bpm', threshold: '120 bpm' }
//   },
//   {
//     id: 2,
//     patientId: 1,
//     type: 'WARNING',
//     message: 'Blood pressure slightly elevated (145/92 mmHg).',
//     timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
//     status: 'ACTIVE',
//     metadata: { vital: 'Blood Pressure', value: '145/92 mmHg', threshold: '140/90 mmHg' }
//   },
//   {
//     id: 3,
//     patientId: 2, 
//     type: 'MILD',
//     message: 'Oxygen saturation dropped to 93%. Monitoring recommended.',
//     timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
//     status: 'RESOLVED',
//     metadata: { vital: 'Oxygen Saturation', value: '93%', threshold: '95%' }
//   },
//   {
//     id: 4,
//     patientId: 1,
//     type: 'WARNING',
//     message: 'Irregular heartbeat detected during routine check.',
//     timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
//     status: 'ACTIVE',
//     metadata: { vital: 'ECG', details: 'Occasional PVCs noted' }
//   },
//    {
//     id: 5,
//     patientId: 3, 
//     type: 'CRITICAL',
//     message: 'Patient reported severe chest pain.',
//     timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
//     status: 'ACTIVE',
//     metadata: { reportedSymptom: 'Severe Chest Pain' }
//   },
//   {
//     id: 6,
//     patientId: 2,
//     type: 'MILD',
//     message: 'Patient reports mild headache.',
//     timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
//     status: 'RESOLVED',
//     metadata: { reportedSymptom: 'Mild Headache' }
//   }
// ];

const getAuthHeader = (): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const alertService = {
  async getAlertsByPatientId(patientId: number): Promise<Alert[]> {
    // console.log(`Fetching alerts for patientId: ${patientId}`);
    // // Simulate API call
    // await new Promise(resolve => setTimeout(resolve, 500));
    // const patientAlerts = MOCK_ALERTS.filter(alert => alert.patientId === patientId);
    // console.log(`Found ${patientAlerts.length} alerts for patientId: ${patientId}`);
    // return patientAlerts;
    const constructedUrl = `${API_URL}/alerts/patient/${patientId}`;
    console.log('alertService.ts: CONSTRUCTED URL for getAlertsByPatientId:', constructedUrl);
    const response = await fetch(constructedUrl, { // ENSURING This is the correct endpoint
        headers: getAuthHeader()
    });
    if (!response.ok) {
        console.error('alertService.ts: Failed to fetch. URL was:', constructedUrl, 'Status:', response.status);
        throw new Error('Failed to fetch alerts for patient');
    }
    const data = await response.json();
    console.log(`Raw alerts data for patient ${patientId}:`, JSON.stringify(data, null, 2));
    return data;
  },

  async getAllAlerts(): Promise<Alert[]> {
    // console.log('Fetching all alerts (for admin/doctor)');
    // // Simulate API call
    // await new Promise(resolve => setTimeout(resolve, 500));
    // console.log(`Returning ${MOCK_ALERTS.length} total alerts`);
    // return MOCK_ALERTS;
    const response = await fetch(`${API_URL}/alerts`, { // Assuming endpoint for all alerts (admin/doctor)
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch all alerts');
    const data = await response.json();
    console.log('Raw alerts data (all):', JSON.stringify(data, null, 2));
    return data;
  },

  async getActiveAlerts(): Promise<Alert[]> {
    // console.log('Fetching all active alerts');
    // await new Promise(resolve => setTimeout(resolve, 500));
    // const activeAlerts = MOCK_ALERTS.filter(alert => alert.status === 'ACTIVE');
    // return activeAlerts;
    const response = await fetch(`${API_URL}/alerts?status=ACTIVE`, { // Assuming endpoint with query param
        headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to fetch active alerts');
    const data = await response.json();
    console.log('Raw alerts data (active):', JSON.stringify(data, null, 2));
    return data;
  }
}; 