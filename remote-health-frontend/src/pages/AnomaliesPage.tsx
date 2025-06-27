import React, { useEffect, useState } from 'react';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { thresholdService } from '../services/thresholds';
import { DiseaseThreshold } from '../types/thresholds';

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

const staticThresholds = [
  {
    vitalSign: 'Heart Rate (BPM)',
    normalRange: '60 – 100 bpm',
    lowThreshold: '< 50 bpm',
    highThreshold: '> 110 bpm',
    explanation: 'Resting heart rate; <50 = bradycardia, >110 = tachycardia.',
  },
  {
    vitalSign: 'Temperature (°C)',
    normalRange: '36.1 – 37.5 °C',
    lowThreshold: '< 35.0 °C',
    highThreshold: '> 38.0 °C',
    explanation: '<35 = hypothermia, >38 = fever.',
  },
  {
    vitalSign: 'SpO₂ (%)',
    normalRange: '95 – 100%',
    lowThreshold: '< 92%',
    highThreshold: '–',
    explanation: '<92% indicates potential hypoxemia (low oxygen level).',
  },
  {
    vitalSign: 'Systolic BP (mmHg)',
    normalRange: '90 – 120 mmHg',
    lowThreshold: '< 90 mmHg',
    highThreshold: '> 140 mmHg',
    explanation: 'Systolic blood pressure; low = hypotension, high = hypertension.',
  },
  {
    vitalSign: 'Diastolic BP (mmHg)',
    normalRange: '60 – 80 mmHg',
    lowThreshold: '< 60 mmHg',
    highThreshold: '> 90 mmHg',
    explanation: 'Diastolic blood pressure; low = hypotension, high = hypertension.',
  },
];

const AnomaliesPage: React.FC = () => {
  const [dynamicThresholds, setDynamicThresholds] = useState<DiseaseThreshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>('heart_rate');
  
  const availableMetrics = [
    { key: 'heart_rate', label: 'Heart Rate' },
    { key: 'temperature', label: 'Temperature' },
    { key: 'spo2', label: 'SpO2' },
    { key: 'systolic_bp', label: 'Systolic BP' },
    { key: 'diastolic_bp', label: 'Diastolic BP' },
  ];

  useEffect(() => {
    const fetchThresholds = async () => {
      try {
        setLoading(true);
        const data = await thresholdService.getAllThresholds();
        setDynamicThresholds(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching disease thresholds:', err);
        setError('Failed to load dynamic thresholds for chart.');
      } finally {
        setLoading(false);
      }
    };
    fetchThresholds();
  }, []);

  const getMetricBarChartData = (metric: string) => {
    const metricKeyMin = `${metric}_min` as keyof DiseaseThreshold;
    const metricKeyMax = `${metric}_max` as keyof DiseaseThreshold;

    return {
      labels: dynamicThresholds.map(t => t.disease),
      datasets: [
        {
          label: 'Minimum Value',
          data: dynamicThresholds.map(t => t[metricKeyMin] as number),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
        },
        {
          label: 'Maximum Value',
          data: dynamicThresholds.map(t => t[metricKeyMax] as number),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
        },
      ],
    };
  };

  const getMetricLabel = (metricKey: string): string => {
    const metric = availableMetrics.find(m => m.key === metricKey);
    return metric ? metric.label : metricKey;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Health Metric Thresholds</h1>
      
      {/* Dynamic Chart Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Metric Analysis Chart</h2>
        <div className="mb-4">
          <label htmlFor="metricSelector" className="block text-sm font-medium text-gray-700 mb-2">
            Select a metric to visualize:
        </label>
        <select
            id="metricSelector"
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
      
        {loading && <div className="p-4 text-center">Loading chart data...</div>}
        {error && <div className="p-4 text-center text-red-500">{error}</div>}
        {!loading && !error && (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="h-80">
              <Bar 
                data={getMetricBarChartData(selectedMetric)} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: `${getMetricLabel(selectedMetric)} - Thresholds by Disease State` },
                  },
                  scales: { y: { beginAtZero: false } }
                }}
              />
            </div>
          </div>
        )}
        </div>

      {/* Static Reference Table Section */}
      <div className="bg-white p-6 rounded-lg shadow-lg mt-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Reference Thresholds</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vital Sign</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Normal Range</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Low Threshold</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">High Threshold</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Explanation</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staticThresholds.map((item) => (
                <tr key={item.vitalSign} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.vitalSign}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.normalRange}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.lowThreshold}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.highThreshold}</td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-500">{item.explanation}</td>
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