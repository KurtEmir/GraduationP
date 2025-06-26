import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { alertService } from '../services/alert';
import { authService } from '../services/auth';
import { Alert } from '../types/alert';

const NotificationsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = authService.getUser();
  const isDoctor = user?.role === 'DOCTOR' || user?.role === 'ADMIN';

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const alertsData = isDoctor
          ? await alertService.getAllAlerts()
          : await alertService.getPatientAlerts(Number(user?.id));
        setAlerts(alertsData);
      } catch (err) {
        setError('Failed to fetch alerts');
        console.error('Error fetching alerts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [isDoctor, user?.id]);

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'CRITICAL':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'WARNING':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'MILD':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'CRITICAL':
        return <span className="text-red-500 text-xl">⚠️</span>;
      case 'WARNING':
        return <span className="text-yellow-500 text-xl">⚠️</span>;
      case 'MILD':
        return <span className="text-blue-500 text-xl">ℹ️</span>;
      default:
        return <span className="text-gray-500 text-xl">ℹ️</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-2 md:px-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        {isDoctor && (
          <Link
            to="/health-map"
            className="text-indigo-600 hover:text-indigo-900 font-semibold"
          >
            View Health Map
          </Link>
        )}
      </div>
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No notifications available</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div
              key={alert.id}
              className={`flex items-center gap-4 p-4 rounded-lg border shadow ${getAlertColor(alert.type)}`}
            >
              {getAlertIcon(alert.type)}
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{alert.message}</p>
                    <p className="text-xs mt-1 text-gray-500">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-white border border-gray-200 ml-2">
                    {alert.type}
                  </span>
                </div>
                {alert.patientId && (
                  <div className="mt-2">
                    <Link
                      to={`/patients/${alert.patientId}`}
                      className="text-sm text-indigo-600 hover:text-indigo-900 font-medium"
                    >
                      View Patient Details →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage; 