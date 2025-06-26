import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { alertService } from '../services/alertService';
import { Alert as AlertType } from '../types/alert';
import { Patient } from '../types/patient';
import { patientService } from '../services/patient'; // To get patient names for alerts
import { format } from 'date-fns';

const AllAlertsPage: React.FC = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]); // For mapping patientId to name
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlertData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        let fetchedAlerts: AlertType[] = [];
        if (user.role === 'PATIENT' && user.id) {
          fetchedAlerts = await alertService.getAlertsByPatientId(user.id);
        } else if (user.role === 'DOCTOR' || user.role === 'ADMIN') {
          fetchedAlerts = await alertService.getAllAlerts();
          // Fetch all patients to map IDs to names for doctor/admin view
          const fetchedPatients = await patientService.getAllPatients();
          setPatients(fetchedPatients);
        }
        // Filter alerts with invalid timestamps first, then sort
        const validTimestampAlerts = fetchedAlerts.filter(alert => alert.timestamp && !isNaN(new Date(alert.timestamp).getTime()));
        validTimestampAlerts.sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());
        setAlerts(validTimestampAlerts);
      } catch (err) {
        console.error('Failed to fetch alerts:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching alerts.');
      } finally {
        setLoading(false);
      }
    };

    fetchAlertData();
  }, [user]);

  const getPatientName = (patientId: number): string => {
    if (user?.role === 'PATIENT' && user?.id === patientId) return "Your Alerts";
    const patient = patients.find(p => p.id === patientId);
    return patient ? patient.name : `Patient ID: ${patientId}`;
  };

  const getAlertRowClass = (type: AlertType['type']) => {
    switch (type) {
      case 'CRITICAL':
        return 'bg-red-50 hover:bg-red-100';
      case 'WARNING':
        return 'bg-yellow-50 hover:bg-yellow-100';
      case 'MILD':
        return 'bg-blue-50 hover:bg-blue-100';
      default:
        return 'bg-gray-50 hover:bg-gray-100';
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading alerts...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">Error: {error}</div>;
  }

  if (!user) {
    return <div className="p-6 text-center text-gray-600">Please log in to view alerts.</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-6">
        {user.role === 'PATIENT' ? 'My Alerts History' : 'System Alerts'}
      </h1>
      {alerts.length === 0 ? (
        <p className="text-gray-500">No alerts found.</p>
      ) : (
        <div className="bg-white shadow-xl rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                {(user.role === 'DOCTOR' || user.role === 'ADMIN') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Patient</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Message</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {alerts.map((alert) => (
                <tr key={alert.id} className={getAlertRowClass(alert.type)}>
                  {(user.role === 'DOCTOR' || user.role === 'ADMIN') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{getPatientName(alert.patientId)}</td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {alert.timestamp && !isNaN(new Date(alert.timestamp).getTime()) ? 
                        format(new Date(alert.timestamp), 'MMM dd, yyyy HH:mm:ss') : 
                        'Invalid date'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${alert.type === 'CRITICAL' ? 'bg-red-200 text-red-800' : 
                        alert.type === 'WARNING' ? 'bg-yellow-200 text-yellow-800' : 
                        'bg-blue-200 text-blue-800'}
                    `}>
                      {alert.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-xs break-words">{alert.message}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <span className={`text-sm font-medium ${alert.status === 'ACTIVE' ? 'text-red-600' : 'text-green-600'}`}>
                        {alert.status}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 max-w-sm break-words">
                    {alert.metadata ? Object.entries(alert.metadata).map(([key, value]) => `${key}: ${value}`).join('; ') : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AllAlertsPage; 