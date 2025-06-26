import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { patientService } from '../services/patient';
import { VitalSigns } from '../types/patient';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale // Import TimeScale for time-series data
} from 'chart.js';
import 'chartjs-adapter-date-fns'; // Import adapter for date handling

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale // Register TimeScale
);

const MyVitalsHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [vitalsHistory, setVitalsHistory] = useState<VitalSigns[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState('');
  const [metricFilter, setMetricFilter] = useState('heartRate');
  const [filteredVitals, setFilteredVitals] = useState<VitalSigns[]>([]);

  useEffect(() => {
    const fetchVitalsHistory = async () => {
      if (user && user.id && user.role === 'PATIENT') {
        try {
          setLoading(true);
          setError(null); // Reset error state before fetching
          const data = await patientService.getVitalSigns(user.id);
          // Sort data by timestamp, oldest first for chart readability
          const sortedData = data.sort((a, b) => 
            new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
          );
          setVitalsHistory(sortedData);
        } catch (err) {
          console.error("Error fetching vitals history:", err);
          setError("Failed to fetch vital signs history. Please check console for details."); // Updated error message
        } finally {
          setLoading(false); // Ensure loading is set to false in finally
        }
      } else {
        setLoading(false); // Also set loading to false if no user/user.id
        if (user && user.role !== 'PATIENT') {
          setError("Vitals history is only available for patient accounts.");
        }
        // Optionally, set a specific message if user is not available, though the component already handles this
        // setError("User not available to fetch vitals history."); 
        setVitalsHistory([]); // Clear any previous history
      }
    };
    fetchVitalsHistory();
  }, [user]);

  useEffect(() => {
    let tempVitals = vitalsHistory;
    if (dateFilter) {
      tempVitals = tempVitals.filter(vital => {
        if (!vital.timestamp) return false;
        const vitalDate = new Date(vital.timestamp).toISOString().slice(0, 10);
        return vitalDate === dateFilter;
      });
    }
    setFilteredVitals(tempVitals);
  }, [dateFilter, vitalsHistory]);

  const metricOptions = [
    { value: 'heartRate', label: 'Heart Rate' },
    { value: 'temperature', label: 'Temperature' },
    { value: 'oxygenSaturation', label: 'SpO2' },
    { value: 'systolic', label: 'Systolic BP' },
    { value: 'diastolic', label: 'Diastolic BP' },
  ];

  const getChartData = () => {
    const labels = filteredVitals.map(v => v.timestamp ? new Date(v.timestamp) : new Date());
    const datasets = [];

    const metricConfig = {
      heartRate: { label: 'Heart Rate (bpm)', data: (v: VitalSigns) => v.heartRate, color: 'rgb(255, 99, 132)' },
      temperature: { label: 'Temperature (°C)', data: (v: VitalSigns) => v.temperature, color: 'rgb(255, 159, 64)' },
      oxygenSaturation: { label: 'SpO2 (%)', data: (v: VitalSigns) => v.oxygenSaturation, color: 'rgb(54, 162, 235)' },
      systolic: { label: 'Systolic BP (mmHg)', data: (v: VitalSigns) => v.systolic, color: 'rgb(153, 102, 255)' },
      diastolic: { label: 'Diastolic BP (mmHg)', data: (v: VitalSigns) => v.diastolic, color: 'rgb(201, 203, 207)' },
    }[metricFilter];
      
    if(metricConfig) {
      datasets.push({
        label: metricConfig.label,
        data: filteredVitals.map(metricConfig.data),
        borderColor: metricConfig.color,
        backgroundColor: `${metricConfig.color.slice(0, -1)}, 0.5)`,
        tension: 0.1,
        fill: false,
      });
    }

    return { labels, datasets };
  };

  const getChartOptions = (metricKey: string) => {
    const metricLabel = metricOptions.find(m => m.value === metricKey)?.label || 'Vital';
    return {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: `${metricLabel} Over Time ${dateFilter ? `on ${new Date(dateFilter).toLocaleDateString()}` : ''}`,
        },
      },
      scales: {
        x: {
          type: 'time' as const,
          time: {
            unit: 'day' as const,
            tooltipFormat: 'PPpp' as const,
            displayFormats: {
              day: 'MMM d' as const
            }
          },
          title: {
            display: true,
            text: 'Date / Time'
          }
        },
        y: {
          beginAtZero: false,
          title: {
              display: true,
              text: 'Value'
          }
        },
      },
    };
  };
  
  if (loading) return <div className="p-4 dark:text-gray-300">Loading vital history...</div>;
  if (error) return <div className="p-4 text-red-600 dark:text-red-400">{error}</div>;
  if (!user) return <div className="p-4 dark:text-gray-300">Please log in to see your vitals history.</div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">My Vital Signs History</h1>
      
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div>
          <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Date</label>
          <input 
            type="date"
            id="date-filter"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="mt-1 block w-full pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark-mode-calendar"
          />
        </div>
        <div>
          <label htmlFor="metric-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Show Chart For</label>
          <select
            id="metric-filter"
            value={metricFilter}
            onChange={(e) => setMetricFilter(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {metricOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      {vitalsHistory.length === 0 && !loading && (
        <p className="text-gray-600 dark:text-gray-400">No vital signs have been recorded yet. Go to <a href="/data-entry" className="text-indigo-600 dark:text-indigo-400 hover:underline">Data Entry</a> to add your first record.</p>
      )}

      {vitalsHistory.length > 0 && (
        <>
          {/* Chart */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
            <div style={{ height: '400px' }}>
              <Line options={getChartOptions(metricFilter)} data={getChartData()} />
            </div>
          </div>

          {/* Vitals List */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              All Recorded Vitals
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Heart Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Temp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">SpO2</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">BP Systolic</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">BP Diastolic</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {[...vitalsHistory].reverse().map((vital, index) => ( // Reverse for newest first in table
                    <tr key={vital.timestamp || index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{vital.timestamp ? new Date(vital.timestamp).toLocaleString() : 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{vital.heartRate ?? 'N/A'} bpm</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{vital.temperature ?? 'N/A'} °C</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{vital.oxygenSaturation ?? 'N/A'} %</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{vital.systolic ?? 'N/A'} mmHg</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{vital.diastolic ?? 'N/A'} mmHg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MyVitalsHistoryPage; 