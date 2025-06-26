import React, { useEffect, useState } from 'react';
import { thresholdService } from '../services/thresholds';
import { DiseaseThreshold } from '../types/thresholds';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AnomaliesPage: React.FC = () => {
  const [thresholds, setThresholds] = useState<DiseaseThreshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>('heart_rate');
  
  const availableMetrics = [
    { key: 'heart_rate', label: 'Heart Rate' },
    { key: 'temperature', label: 'Temperature' },
    { key: 'spo2', label: 'SpO2' },
    { key: 'systolic_bp', label: 'Systolic BP' },
    { key: 'diastolic_bp', label: 'Diastolic BP' }
  ];

  useEffect(() => {
    const fetchThresholds = async () => {
      try {
        setLoading(true);
        const data = await thresholdService.getAllThresholds();
        setThresholds(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching disease thresholds:', err);
        setError('Failed to load disease thresholds. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchThresholds();
  }, []);

  const getMetricBarChartData = (metric: string) => {
    const metricKeyMin = `${metric}_min` as keyof DiseaseThreshold;
    const metricKeyMax = `${metric}_max` as keyof DiseaseThreshold;

    const normalThreshold = thresholds.find(t => t.disease === 'Normal');

    if (!normalThreshold) {
      // Fallback if "Normal" is not defined, show all
      return {
        labels: thresholds.map(t => t.disease),
        datasets: [
          {
            label: 'Minimum Value',
            data: thresholds.map(t => t[metricKeyMin] as number),
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
          },
          {
            label: 'Maximum Value',
            data: thresholds.map(t => t[metricKeyMax] as number),
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
          },
        ],
      };
    }
    
    const normalMin = normalThreshold[metricKeyMin];
    const normalMax = normalThreshold[metricKeyMax];

    const relevantThresholds = thresholds.filter(t => 
      t.disease === 'Normal' || t[metricKeyMin] !== normalMin || t[metricKeyMax] !== normalMax
    );

    return {
      labels: relevantThresholds.map(t => t.disease),
      datasets: [
        {
          label: 'Minimum Value',
          data: relevantThresholds.map(t => t[metricKeyMin] as number),
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        },
        {
          label: 'Maximum Value',
          data: relevantThresholds.map(t => t[metricKeyMax] as number),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        },
      ],
    };
  };

  const getMetricLabel = (metricKey: string): string => {
    const metric = availableMetrics.find(m => m.key === metricKey);
    return metric ? metric.label : metricKey;
  };

  if (loading) {
    return <div className="p-6 text-center">Loading thresholds data...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Health Metric Thresholds</h1>
      
      <div className="mb-8">
        <label htmlFor="diseaseSelector" className="block text-sm font-medium text-gray-700 mb-2">
          Select Health Metric:
        </label>
        <select
          id="diseaseSelector"
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value)}
          className="border border-gray-300 rounded-md p-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[200px]"
        >
          {availableMetrics.map(metric => (
            <option key={metric.key} value={metric.key}>
              {metric.label}
            </option>
          ))}
        </select>
      </div>
      
      {selectedMetric && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {getMetricLabel(selectedMetric)} - Thresholds by Risk Level
          </h2>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="h-80">
              <Bar 
                data={getMetricBarChartData(selectedMetric)} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: false,
                      title: {
                        display: true,
                        text: 'Values',
                        color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.8)' : undefined
                      },
                      ticks: {
                        color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.7)' : undefined
                      },
                      grid: {
                        color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : undefined
                      }
                    },
                    x: {
                      ticks: {
                        color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.7)' : undefined
                      },
                      grid: {
                        color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : undefined
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: {
                        color: '#374151'
                      }
                    },
                    title: {
                      display: true,
                      text: `${getMetricLabel(selectedMetric)} Thresholds`,
                      color: '#111827'
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Threshold Table
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Heart Rate (Min)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Heart Rate (Max)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Temperature (Min)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Temperature (Max)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SpO2 (Min)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SpO2 (Max)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Systolic BP (Min)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Systolic BP (Max)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Diastolic BP (Min)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Diastolic BP (Max)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {thresholds.map((threshold) => (
                <tr key={threshold.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {threshold.disease}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {threshold.heart_rate_min}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {threshold.heart_rate_max}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {threshold.temperature_min}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {threshold.temperature_max}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {threshold.spo2_min}
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {threshold.spo2_max}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {threshold.systolic_bp_min}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {threshold.systolic_bp_max}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {threshold.diastolic_bp_min}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {threshold.diastolic_bp_max}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnomaliesPage; 