import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { patientService } from '../services/patient';
import { Patient, VitalSigns } from '../types/patient';
import { Alert } from '../types/alert';
import { API_URL } from '../config';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const getAuthHeader = (): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const PatientDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [vitals, setVitals] = useState<VitalSigns[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        if (!userId) return;
        const patientUserId = parseInt(userId);
        
        // Fetch patient data first using the user ID
        let patientData: Patient;
        try {
          // Assuming patientService has a method to get by user_id
          patientData = await patientService.getPatientByUserId(patientUserId);
          setPatient(patientData);
        } catch (patientErr) {
          console.error('Error fetching patient data:', patientErr);
          throw new Error('Failed to fetch patient details');
        }
        
        // Fetch vital signs with better error handling
        try {
          console.log(`Fetching vital signs for patient user ID: ${patientUserId}`);
          const vitalsData = await patientService.getVitalSigns(patientUserId);
          console.log(`Received ${vitalsData.length} vital sign records`);
          setVitals(vitalsData);
        } catch (vitalsErr) {
          console.error('Error fetching vital signs:', vitalsErr);
          // Don't throw here, continue with empty vitals
          setVitals([]);
          setError(prevError => prevError || 'Warning: Failed to load vital signs');
        }
        
        // Fetch alerts with better error handling and fallback
        try {
          // First try the documented endpoint
          const alertUrl = `${API_URL}/alerts/patient/${patientUserId}`;
          console.log(`Fetching alerts from: ${alertUrl}`);
          
          const alertsResponse = await fetch(alertUrl, { 
            headers: getAuthHeader() 
          });
          
          if (!alertsResponse.ok) {
            console.warn(`Alert fetch failed with status: ${alertsResponse.status}`);
            // Try alternative endpoint format if the main one fails
            const alternateUrl = `${API_URL}/alerts/patient/${patientUserId}/`;
            console.log(`Trying alternate alerts URL with trailing slash: ${alternateUrl}`);
            
            const alternateResponse = await fetch(alternateUrl, { 
              headers: getAuthHeader() 
            });
            
            if (!alternateResponse.ok) {
              console.error(`Both alert endpoints failed. Status: ${alternateResponse.status}`);
              setAlerts([]);
            } else {
              const alertsData = await alternateResponse.json();
              setAlerts(alertsData);
            }
          } else {
            const alertsData = await alertsResponse.json();
            setAlerts(alertsData);
          }
        } catch (alertErr) {
          console.error('Error fetching alerts:', alertErr);
          // Don't throw here, continue with empty alerts
          setAlerts([]);
        }

      } catch (err) {
        console.error('Error in patient detail page:', err);
        if (err instanceof Error) {
            setError(`Failed to fetch patient data: ${err.message}`);
        } else {
            setError('Failed to fetch patient data due to an unknown error.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
        fetchPatientData();
    } else {
        setError("Patient User ID not found in URL.");
        setLoading(false);
    }
  }, [userId]);

  const chartData = {
    labels: vitals.map(v => new Date(v.timestamp || '').toLocaleDateString()),
    datasets: [
      {
        label: 'Heart Rate',
        data: vitals.map(v => v.heartRate),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
        fill: false
      },
      {
        label: 'Temperature',
        data: vitals.map(v => v.temperature),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        fill: false
      },
      {
        label: 'SpO2',
        data: vitals.map(v => v.oxygenSaturation),
        borderColor: 'rgb(53, 162, 235)',
        tension: 0.1,
        fill: false
      }
    ]
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error || 'Patient not found'}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-2 md:px-0">
      {/* Patient Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div className="bg-white shadow rounded-lg p-6 flex items-center gap-4 flex-grow">
          <div className="h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
            {(patient && patient.full_name && typeof patient.full_name === 'string' ? patient.full_name.charAt(0).toUpperCase() : '?')}
          </div>
          <div>
            <div className="font-semibold text-xl text-gray-900">{patient && patient.full_name ? patient.full_name : 'N/A'}</div>
            <div className="text-gray-500 text-sm">{patient && patient.email ? patient.email : 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vital Signs Chart */}
        <div className="bg-white shadow rounded-lg p-6 col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Vital Signs History</h2>
          <div className="h-72">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } },
                plugins: { legend: { position: 'top' } }
              }}
            />
          </div>
        </div>
        {/* Recent Alerts */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h2>
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <p className="text-gray-500">No recent alerts</p>
            ) : (
              alerts.slice(0, 4).map(alert => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border border-red-200 bg-red-50 flex items-center gap-3`}
                >
                  <span className="text-red-500 text-xl">⚠️</span>
                  <div>
                    <div className="font-semibold text-red-700">{alert.message}</div>
                    <div className="text-xs text-gray-500">{new Date(alert.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetailPage; 