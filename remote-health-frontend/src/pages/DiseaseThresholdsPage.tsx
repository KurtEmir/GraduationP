import React, { useEffect, useState } from 'react';
import { thresholdService } from '../services/thresholds';
import { DiseaseThreshold, ThresholdMetric } from '../types/thresholds';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const DiseaseThresholdsPage: React.FC = () => {
  const [thresholds, setThresholds] = useState<DiseaseThreshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<ThresholdMetric>('heart_rate');
  const [viewMode, setViewMode] = useState<'by-metric' | 'by-disease'>('by-metric');
  const [selectedDisease, setSelectedDisease] = useState<string | 'all'>('all');

  useEffect(() => {
    const fetchThresholds = async () => {
      try {
        setLoading(true);
        const data = await thresholdService.getAllThresholds();
        setThresholds(data);
        
        // Set the first disease as default selected disease if available
        if (data.length > 0 && selectedDisease === 'all') {
          setSelectedDisease(data[0].disease);
        }
        
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

  // Data for comparing a single metric across all diseases
  const getMetricBarChartData = () => {
    const minField = `${selectedMetric}_min` as keyof DiseaseThreshold;
    const maxField = `${selectedMetric}_max` as keyof DiseaseThreshold;

    return {
      labels: thresholds.map(t => t.disease),
      datasets: [
        {
          label: `Minimum ${formatMetricLabel(selectedMetric)}`,
          data: thresholds.map(t => t[minField] as number),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: `Maximum ${formatMetricLabel(selectedMetric)}`,
          data: thresholds.map(t => t[maxField] as number),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  // Data for showing all metrics for a single disease
  const getDiseaseBarChartData = () => {
    const selectedThreshold = thresholds.find(t => t.disease === selectedDisease);
    
    if (!selectedThreshold) {
      return {
        labels: [],
        datasets: []
      };
    }

    return {
      labels: ['Heart Rate (BPM)', 'Temperature (°C)', 'SpO2 (%)'],
      datasets: [
        {
          label: 'Minimum Values',
          data: [
            selectedThreshold.heart_rate_min,
            selectedThreshold.temperature_min,
            selectedThreshold.spo2_min
          ],
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: 'Maximum Values',
          data: [
            selectedThreshold.heart_rate_max,
            selectedThreshold.temperature_max,
            selectedThreshold.spo2_max
          ],
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  // For the individual disease cards
  const getSingleDiseaseChartData = (disease: DiseaseThreshold) => {
    return {
      labels: ['Heart Rate (BPM)', 'Temperature (°C)', 'SpO2 (%)'],
      datasets: [
        {
          label: 'Minimum Values',
          data: [
            disease.heart_rate_min,
            disease.temperature_min,
            disease.spo2_min
          ],
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: 'Maximum Values',
          data: [
            disease.heart_rate_max,
            disease.temperature_max,
            disease.spo2_max
          ],
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  const formatMetricLabel = (metric: ThresholdMetric): string => {
    switch (metric) {
      case 'heart_rate':
        return 'Heart Rate (BPM)';
      case 'temperature':
        return 'Body Temperature (°C)';
      case 'spo2':
        return 'Oxygen Saturation (%)';
      default:
        return metric;
    }
  };

  const getMetricUnit = (metric: ThresholdMetric): string => {
    switch (metric) {
      case 'heart_rate':
        return 'BPM';
      case 'temperature':
        return '°C';
      case 'spo2':
        return '%';
      default:
        return '';
    }
  };

  // Create chart options for the individual disease cards
  const getIndividualDiseaseChartOptions = (title: string) => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
        },
        x: {
          title: {
            display: true,
            text: 'Vital Signs'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: title,
          font: {
            size: 16,
            weight: 'bold' as const
          }
        },
        legend: {
          position: 'top' as const,
        }
      }
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading disease thresholds...</div>
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
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Disease Thresholds</h1>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <label className="mr-2 text-gray-700">View Mode:</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'by-metric' | 'by-disease')}
              className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="by-metric">Compare by Metric</option>
              <option value="by-disease">View by Disease</option>
            </select>
          </div>
          
          {viewMode === 'by-metric' && (
            <div>
              <label className="mr-2 text-gray-700">Select Metric:</label>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as ThresholdMetric)}
                className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="heart_rate">Heart Rate</option>
                <option value="temperature">Temperature</option>
                <option value="spo2">Oxygen Saturation (SpO2)</option>
              </select>
            </div>
          )}
          
          {viewMode === 'by-disease' && (
            <div>
              <label className="mr-2 text-gray-700">Select Disease:</label>
              <select
                value={selectedDisease}
                onChange={(e) => setSelectedDisease(e.target.value)}
                className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {thresholds.map(t => (
                  <option key={t.id} value={t.disease}>{t.disease}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Chart Visualization */}
      {viewMode === 'by-metric' && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {formatMetricLabel(selectedMetric)} Thresholds by Disease
          </h2>
          <div className="h-96">
            <Bar
              data={getMetricBarChartData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: false,
                    title: {
                      display: true,
                      text: formatMetricLabel(selectedMetric)
                    }
                  },
                  x: {
                    title: {
                      display: true,
                      text: 'Disease'
                    }
                  }
                },
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `${context.dataset.label}: ${context.raw} ${getMetricUnit(selectedMetric)}`;
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      )}
      
      {viewMode === 'by-disease' && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {selectedDisease} - Vital Sign Thresholds
          </h2>
          <div className="h-96">
            <Bar
              data={getDiseaseBarChartData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: false,
                    title: {
                      display: true,
                      text: 'Values'
                    }
                  },
                  x: {
                    title: {
                      display: true,
                      text: 'Vital Signs'
                    }
                  }
                },
                plugins: {
                  legend: {
                    position: 'top',
                  }
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Individual Disease Cards Grid */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        All Disease Thresholds
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {thresholds.map(disease => (
          <div key={disease.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">{disease.disease}</h3>
            </div>
            <div className="p-4 h-64">
              <Bar
                data={getSingleDiseaseChartData(disease)}
                options={getIndividualDiseaseChartOptions(disease.disease)}
              />
            </div>
            <div className="p-4 bg-gray-50 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="font-semibold">Heart Rate:</p>
                  <p>{disease.heart_rate_min} - {disease.heart_rate_max} BPM</p>
                </div>
                <div>
                  <p className="font-semibold">Temperature:</p>
                  <p>{disease.temperature_min} - {disease.temperature_max} °C</p>
                </div>
                <div>
                  <p className="font-semibold">SpO2:</p>
                  <p>{disease.spo2_min} - {disease.spo2_max} %</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <h2 className="text-xl font-semibold text-gray-800 p-6 border-b">
          Detailed Threshold Values
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Disease
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Heart Rate (min-max)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Temperature (min-max)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SpO2 (min-max)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {thresholds.map((threshold) => (
                <tr key={threshold.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {threshold.disease}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {threshold.heart_rate_min} - {threshold.heart_rate_max} BPM
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {threshold.temperature_min} - {threshold.temperature_max} °C
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {threshold.spo2_min} - {threshold.spo2_max} %
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

export default DiseaseThresholdsPage; 