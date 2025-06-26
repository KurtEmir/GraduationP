import React from 'react';
import { Alert } from '../../types/alert';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface RecentAlertsProps {
  alerts: Alert[];
  title?: string;
  maxDisplay?: number;
}

const getAlertColor = (type: Alert['type']) => {
  switch (type) {
    case 'CRITICAL':
      return 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-300';
    case 'WARNING':
      return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500 text-yellow-700 dark:text-yellow-300';
    case 'MILD':
      return 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300';
    default:
      return 'bg-gray-100 dark:bg-gray-700 border-gray-500 text-gray-700 dark:text-gray-300';
  }
};

const RecentAlerts: React.FC<RecentAlertsProps> = ({ alerts, title = 'Recent Alerts', maxDisplay = 5 }) => {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">{title}</h3>
        <p className="text-gray-500 dark:text-gray-400">No alerts at this time.</p>
      </div>
    );
  }

  const sortedAlerts = [...alerts]
    .filter(alert => alert.timestamp && !isNaN(new Date(alert.timestamp).getTime()))
    .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());
  const alertsToDisplay = sortedAlerts.slice(0, maxDisplay);

  return (
    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{title}</h3>
      <div className="space-y-4">
        {alertsToDisplay.map((alert) => (
          <div
            key={alert.id}
            className={`border-l-4 p-4 rounded-md shadow-sm ${getAlertColor(alert.type)}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{alert.type}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{alert.message}</p>
                {alert.metadata && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Details: {Object.entries(alert.metadata).map(([key, value]) => `${key}: ${value}`).join(', ')}
                  </p>
                )}
              </div>
              <div className="text-right ml-2 flex-shrink-0">
                 <p className={`text-xs font-medium ${alert.status === 'ACTIVE' ? 'text-red-500' : 'text-green-500'}`}>
                    {alert.status}
                 </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {alert.timestamp && !isNaN(new Date(alert.timestamp).getTime()) ? 
                    format(new Date(alert.timestamp), 'MMM dd, HH:mm') : 
                    'Invalid date'}
                </p>
              </div>
            </div>
          </div>
        ))}
        {alerts.length > maxDisplay && (
          <Link to="/alerts" className="text-sm text-blue-500 hover:text-blue-400 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer mt-3 block text-center">
            View all ({alerts.length}) alerts...
          </Link>
        )}
      </div>
    </div>
  );
};

export default RecentAlerts; 