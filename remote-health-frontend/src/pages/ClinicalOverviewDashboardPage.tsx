import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { patientService } from '../services/patient';
import { alertService } from '../services/alertService';
import { Patient } from '../types/patient';
import { Alert } from '../types/alert';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ClinicalOverviewDashboardPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [selectedAlarmSeverity, setSelectedAlarmSeverity] = useState<Alert['type'] | 'all'>('all');
  const [selectedChronicDisease, setSelectedChronicDisease] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [patientsData, alertsData] = await Promise.all([
          patientService.getAllPatients(),
          alertService.getAllAlerts()
        ]);
        setPatients(patientsData);
        setAlerts(alertsData);
        setError(null);
      } catch (err) {
        console.error("Error fetching clinical overview data:", err);
        setError("Failed to load clinical overview data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredAndSortedPatients = patients.filter(patient => {
    // Alarm Severity Filter
    if (selectedAlarmSeverity !== 'all') {
      const patientAlerts = alerts.filter(alert => alert.patientId === patient.user_id);
      if (!patientAlerts.some(alert => alert.type === selectedAlarmSeverity)) {
        return false;
      }
    }
    // Chronic Disease Filter
    if (selectedChronicDisease !== 'all') {
      const patientDiseases = (patient.chronic_diseases || '').toLowerCase().split(',').map(d => d.trim());
      if (!patientDiseases.includes(selectedChronicDisease.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  // Sorting logic
  const getPatientMaxSeverity = (patientUserId: number): number => {
    const patientAlerts = alerts.filter(alert => alert.patientId === patientUserId);
    if (patientAlerts.length === 0) return 3; // No alerts, lowest priority
    if (patientAlerts.some(alert => alert.type === 'CRITICAL')) return 0; // Critical, highest priority
    if (patientAlerts.some(alert => alert.type === 'WARNING')) return 1; // Warning
    if (patientAlerts.some(alert => alert.type === 'MILD')) return 2; // Mild
    return 3; // Should not happen if alerts exist, but as a fallback
  };

  const sortedPatients = [...filteredAndSortedPatients].sort((a, b) => {
    const severityA = getPatientMaxSeverity(a.user_id);
    const severityB = getPatientMaxSeverity(b.user_id);

    if (severityA !== severityB) {
      return severityA - severityB; // Sort by severity (0 is highest)
    }
    return (a.name || '').localeCompare(b.name || ''); // Then by name
  });

  // Chart Data Preparation
  const alertTypes = ['CRITICAL', 'WARNING', 'MILD'];
  const alertCounts = alertTypes.map(type => 
    alerts.filter(alert => alert.type === type).length
  );

  const alertDistributionData = {
    labels: alertTypes,
    datasets: [
      {
        label: 'Number of Alerts',
        data: alertCounts,
        backgroundColor: [
          'rgba(239, 68, 68, 0.6)', // red-500
          'rgba(245, 158, 11, 0.6)', // yellow-500
          'rgba(59, 130, 246, 0.6)', // blue-500
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(59, 130, 246, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Alert Distribution by Type',
      },
    },
    scales: {
        y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Patient Count'
            },
            ticks: { // To show only integers on the Y axis
              precision: 0
            }
        }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-500 dark:text-gray-400">Loading Clinical Overview...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-10 text-center">
        <h2 className="text-2xl font-semibold text-red-600 mb-4">Error</h2>
        <p className="text-lg text-red-500 mb-8">{error}</p>
        <Link 
          to="/dashboard"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Clinical Overview Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Strategic insights for patient risk stratification and proactive health management.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Filters & Prioritization</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="alarmSeverity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Alarm Severity</label>
              <select 
                id="alarmSeverity" 
                name="alarmSeverity"
                value={selectedAlarmSeverity}
                onChange={(e) => setSelectedAlarmSeverity(e.target.value as Alert['type'] | 'all')}
                className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="mild">Mild</option>
              </select>
            </div>
            <div>
              <label htmlFor="chronicDisease" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Chronic Disease</label>
              <select 
                id="chronicDisease" 
                name="chronicDisease"
                value={selectedChronicDisease}
                onChange={(e) => setSelectedChronicDisease(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Diseases</option>
                <option value="diabetes">Diabetes</option>
                <option value="hypertension">Hypertension</option>
              </select>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">More filter options will be available here.</p>
          </div>
        </section>

        <section className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Prioritized Patient List ({sortedPatients.length})</h2>
          {sortedPatients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Recent Alert</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Risk Score</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedPatients.slice(0, 15).map(patient => {
                    const latestAlert = alerts
                      .filter(a => a.patientId === patient.user_id)
                      .sort((x,y) => new Date(y.timestamp).getTime() - new Date(x.timestamp).getTime())[0];
                    return (
                      <tr key={patient.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{patient.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{patient.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {latestAlert ? (
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${latestAlert.type === 'CRITICAL' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 
                                latestAlert.type === 'WARNING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}
                            `}>
                              {latestAlert.message}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-gray-500">No recent alerts</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">N/A</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link to={`/patients/${patient.id}`} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3">Details</Link>
                          <Link to={`/messaging?partnerId=${patient.user_id}`} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">Message</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 py-4">No patients match the current criteria or no patients available.</p>
          )}
        </section>

        <section className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-lg shadow mt-6">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Health Analytics Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Chart 1: Alert Distribution */}
            <div className="md:col-span-2 lg:col-span-1 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-inner">
              <h3 className="text-md font-medium text-gray-600 dark:text-gray-300 mb-3 text-center">Alert Distribution</h3>
              <div style={{ height: '250px' }}>
                <Bar options={chartOptions} data={alertDistributionData} />
              </div>
            </div>
            {/* Placeholder for Chart 2 */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-inner">
              <h3 className="text-md font-medium text-gray-600 dark:text-gray-300 mb-2">Patients by Risk Level</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Chart showing number of patients in High, Medium, Low risk categories.</p>
              {/* TODO: Add Chart component here */}
            </div>
            {/* Statistic 1: Active Critical Alerts */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg shadow-inner flex flex-col items-center justify-center">
              <h3 className="text-md font-medium text-red-700 dark:text-red-300 mb-1">Active Critical Alerts</h3>
              <p className="text-4xl font-bold text-red-600 dark:text-red-400">{alerts.filter(a => a.type === 'CRITICAL').length}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ClinicalOverviewDashboardPage; 