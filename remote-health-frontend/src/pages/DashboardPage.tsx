import React, { useEffect, useState, useCallback, useRef } from 'react';
import PatientProfileErrorPage from './PatientProfileErrorPage';
import { patientService } from '../services/patient';
import { alertService } from '../services/alertService';
import { useAuth } from '../contexts/AuthContext';
import { Patient, VitalSigns } from '../types/patient';
import { Alert as AlertType } from '../types/alert';
import { Link } from 'react-router-dom';
import {
    SummaryAlertsIcon,
    HeartIcon,
    BloodPressureIcon,
    ThermometerIcon,
    OxygenIcon
} from '../components/icons';
import VitalSignCard from '../components/Dashboard/VitalSignCard';
import LiveVitalsCard from '../components/Dashboard/LiveVitalsCard';
import DashboardSummaryCards from '../components/Dashboard/DashboardSummaryCards';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip as ChartTooltip,
    Legend,
    TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import MonitorPatientsModal from '../components/Dashboard/MonitorPatientsModal';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    ChartTooltip,
    Legend,
    TimeScale 
);

const DashboardPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [allSystemAlerts, setAllSystemAlerts] = useState<AlertType[]>([]);
  const [healthRecordsActivity, setHealthRecordsActivity] = useState<{ month: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Chart data (mock) - Will be addressed when implementing real charting
  // This is for the Doctor/Admin dashboard's "Health Records" chart
  const healthRecordsChartDataOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: false, // Title is handled by the card
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,          titleFont: {
          size: 14,
          weight: 600
        },
        bodyFont: {
          size: 12
        },
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y;
            }
            return label;
          }
        }
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Month',
          padding: { top: 10, bottom: 0 },
          font: {
            size: 12,
            weight: 500
          }
        },
        ticks: {
          font: {
            size: 11
          }
        },
        grid: {
          display: false
        }
      },
      y: {
        title: {
          display: true,
          text: 'Record Count',
          padding: { top: 0, bottom: 10 },
          font: {
            size: 12,
            weight: 500
          }
        },
        beginAtZero: true,
        ticks: {
          font: {
            size: 11
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
    },
  };

  const healthRecordsChartData = {
    labels: healthRecordsActivity.map(item => item.month),
    datasets: [
      {
        label: 'Health Records Created',
        data: healthRecordsActivity.map(item => item.count),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      },
    ],
  };

  // State for patient's own vital signs etc.
  const [myVitalsDisplay, setMyVitalsDisplay] = useState<VitalSigns[]>([]);
  const [lastVital, setLastVital] = useState<VitalSigns | null>(null);
  const [patientSpecificAlerts, setPatientSpecificAlerts] = useState<AlertType[]>([]);
  const [patientDetails, setPatientDetails] = useState<Patient | null>(null);
  const [useFakeData, setUseFakeData] = useState(true); // Toggle for demo mode
  const fakeDataIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMonitorModalOpen, setIsMonitorModalOpen] = useState(false);
  const [monitoredPatientIds, setMonitoredPatientIds] = useState<number[]>([]);

  const fetchPatientSpecificData = useCallback(async (currentUserId: number, currentUserEmail: string, currentUserFirstName?: string, currentUserLastName?: string) => {
    // Double-check user role before making any patient-specific API calls
    if (!user || user.role !== 'PATIENT') {
      console.log('DashboardPage: Skipping patient data fetch - user is not a patient');
      return;
    }
    
    let profileData: Patient | null = null;
    let fetchErrorOccurred = false; // Flag to track if an error was set by the initial profile fetch try/catch
    try {
      profileData = await patientService.getCurrentPatientProfile();
    } catch (err) {
      console.error('Dashboard: Error fetching patient profile:', err); 
      setError('Failed to fetch patient profile.');
      fetchErrorOccurred = true;
    }

    if (profileData && profileData.id) {
      setPatientDetails(profileData);
      setError(null); // Clear error on successful profile fetch
      try {
        const vitalsData = await patientService.getVitalSigns(currentUserId);
        setMyVitalsDisplay(vitalsData);
        setLastVital(vitalsData.length > 0 ? vitalsData.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())[0] : null);

        const patientAlertsData = await alertService.getAlertsByPatientId(currentUserId);
        setPatientSpecificAlerts(patientAlertsData);
      } catch (dataFetchError) {
        console.error("Dashboard: Error fetching vitals or alerts for real profile:", dataFetchError);
        setError('Failed to fetch patient data (vitals/alerts).'); // Set user-facing error for subsequent data load issues
        setLastVital(null);
        setMyVitalsDisplay([]);
        setPatientSpecificAlerts([]);
      }
    } else { // profileData is null or doesn't have id
      if (!fetchErrorOccurred) { // Only set "not found" if no preceding fetch error was already set by the try/catch block.
          setError('Patient profile not found or an issue occurred while fetching it.');
      }
      // Clear other patient specific data as profile is not available
      setLastVital(null);
      setMyVitalsDisplay([]);
      setPatientSpecificAlerts([]);
    }
  }, []);

  const fetchDoctorAdminData = useCallback(async () => {
    try {
      const patientsData = await patientService.getAllPatients();
      if (patientsData && patientsData.length > 0) {
        setPatients(patientsData);
      } else {
        setPatients([]); // Set to empty array if no patients
      }
      const alertsData = await alertService.getAllAlerts();
      setAllSystemAlerts(alertsData);

      const activityStats = await patientService.getVitalSignsActivityStats();
      if (Array.isArray(activityStats) && activityStats.every(item => typeof item === 'object' && item !== null && 'month' in item && 'count' in item)) {
        setHealthRecordsActivity(activityStats);
      } else {
        console.warn("Received unexpected data format for health records activity, defaulting to empty. Data:", activityStats);
        setHealthRecordsActivity([]);
      }
      setError(null); // Clear previous errors on successful fetch

    } catch (err) {
      setError('Failed to fetch doctor/admin data. Some information may be missing.');
      setPatients([]); 
      setAllSystemAlerts([]);
      setHealthRecordsActivity([]);
    }
  }, []);

  useEffect(() => {
    if (user && user.id && user.email) {
      setLoading(true);
      setError(null);
      
      console.log('DashboardPage: User role is:', user.role); // Debug log

      const loadAllData = async () => {
        if (user.role === 'PATIENT') {
          console.log('DashboardPage: Loading patient-specific data'); // Debug log
          await fetchPatientSpecificData(user.id, user.email, user.firstName, user.lastName);
        }
        if (user.role === 'DOCTOR' || user.role === 'ADMIN') {
          console.log('DashboardPage: Loading doctor/admin data'); // Debug log
          await fetchDoctorAdminData();
        }
        setLoading(false);
      };
      loadAllData();
    } else if (!user) {
      setLoading(false);
      setPatientDetails(null);
      setPatients([]);
      setAllSystemAlerts([]);
      setMyVitalsDisplay([]);
      setLastVital(null);
      setPatientSpecificAlerts([]);
      setHealthRecordsActivity([]); // Clear on logout/no user
    }
  }, [user, fetchPatientSpecificData, fetchDoctorAdminData]);

  // Vital signs polling useEffect - This could be reactivated later if needed
  // For now, vitals are fetched once with other patient data.

  // Modal State for Patient's Add Vital Signs
  const [newVitals, setNewVitals] = useState<{
    heartRate: string;
    bloodPressureSystolic: string;
    bloodPressureDiastolic: string;
    temperature: string;
    oxygenSaturation: string;
    // respiratoryRate: string; // Şimdilik eklemiyoruz
  }>({
    heartRate: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    temperature: '',
    oxygenSaturation: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewVitals(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user && user.id) {
      try {
        const vitalDataToSubmit: VitalSigns = {
          timestamp: new Date().toISOString(),
          heartRate: Number(newVitals.heartRate) || undefined,
          systolic: Number(newVitals.bloodPressureSystolic) || undefined,
          diastolic: Number(newVitals.bloodPressureDiastolic) || undefined,
          temperature: Number(newVitals.temperature) || undefined,
          oxygenSaturation: Number(newVitals.oxygenSaturation) || undefined,
          // pulse can be added if there's a form field for it
          // respiratoryRate: 0, // Mock value or can be added to form
        };
        await patientService.addVitalSigns(user.id as number, vitalDataToSubmit); // Cast user.id to number if service expects number
        setIsModalOpen(false);
        setNewVitals({
            heartRate: '',
            bloodPressureSystolic: '',
            bloodPressureDiastolic: '',
            temperature: '',
            oxygenSaturation: '',
        });
        if (user.role === 'PATIENT') {
            fetchPatientSpecificData(user.id as number, user.email!, user.firstName, user.lastName); // Cast user.id to number, non-null assertion for email
        }
      } catch (err) {
        console.error("Failed to add vital signs:", err);
        setError('Failed to add vital signs. Please check the values and try again.');
      }
    }
  };

  // Live fake data polling for demo/testing
  useEffect(() => {
    if (user?.role === 'PATIENT' && useFakeData) {
      // Set initial fake data immediately
      const updateFakeVitals = () => {
        const fakeVital = patientService.getLiveFakeVitals();
        
        // Update last vital first to ensure immediate UI update
        setLastVital(fakeVital);
        
        // Keep a rolling window of vitals for chart/history
        setMyVitalsDisplay(prev => {
          const newVitals = [...prev.slice(-39), fakeVital];
          return newVitals;
        });
      };
      
      // Initial update
      updateFakeVitals();
      
      // Set up interval for regular updates
      const intervalId = setInterval(updateFakeVitals, 2000);
      fakeDataIntervalRef.current = intervalId;
      
      return () => {
        if (intervalId) {
          clearInterval(intervalId);
          fakeDataIntervalRef.current = null;
        }
      };
    } else {
      // Clear interval when switching to real data
      if (fakeDataIntervalRef.current) {
        clearInterval(fakeDataIntervalRef.current);
        fakeDataIntervalRef.current = null;
      }
    }
  }, [user, useFakeData]);

  const today = new Date();
  const formattedDate = format(today, 'dd MMMM yyyy, EEEE', { locale: enUS });
  const userFullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'User';

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="mb-8 p-8 bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg rounded-2xl">
          <Skeleton width={300} height={36} className="mb-2" />
          <Skeleton width={200} height={24} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white shadow-lg rounded-xl p-6">
              <Skeleton width={40} height={40} className="mb-4" />
              <Skeleton width={120} height={20} className="mb-2" />
              <Skeleton width={80} height={24} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
            <Skeleton width={200} height={24} className="mb-4" />
            <Skeleton height={300} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <Skeleton width={150} height={24} className="mb-4" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} height={60} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !patientDetails && user?.role === 'PATIENT') {
    // Show custom error page for patient profile fetch error
    return <PatientProfileErrorPage />;
  }
  if (error && user?.role !== 'PATIENT' && patients.length === 0) {
     return <div className="p-6 text-center text-red-500">Error: {error}. Please try again later.</div>;
  }

  const renderPatientDashboard = () => {
    if (!patientDetails) {
      return <div className="p-4 text-gray-600">Loading patient information... If this persists, there might be an issue fetching your profile.</div>;
    }

    // Create chart data for vital signs with improved visualization
    const vitalSignsData = {
      labels: myVitalsDisplay.map(v => new Date(v.timestamp || '')),
      datasets: [
        {
          label: 'Heart Rate',
          data: myVitalsDisplay.map(v => v.heartRate),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.3,
          fill: true,
          yAxisID: 'y-hr',
          pointRadius: 3,
          pointHoverRadius: 6,
        },
        {
          label: 'Blood Pressure (Systolic)',
          data: myVitalsDisplay.map(v => v.systolic),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
          fill: true,
          yAxisID: 'y-bp',
          pointRadius: 3,
          pointHoverRadius: 6,
        },
        {
          label: 'Blood Pressure (Diastolic)',
          data: myVitalsDisplay.map(v => v.diastolic),
          borderColor: 'rgb(147, 197, 253)',
          backgroundColor: 'rgba(147, 197, 253, 0.1)',
          tension: 0.3,
          fill: true,
          yAxisID: 'y-bp',
          pointRadius: 3,
          pointHoverRadius: 6,
        },
        {
          label: 'Oxygen Saturation',
          data: myVitalsDisplay.map(v => v.oxygenSaturation),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.3,
          fill: true,
          yAxisID: 'y-spo2',
          pointRadius: 3,
          pointHoverRadius: 6,
        },
      ],
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12,
              weight: 500,
            },
          },
        },
        tooltip: {
          mode: 'index' as const,
          intersect: false,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#1f2937',
          bodyColor: '#4b5563',
          borderColor: '#e5e7eb',
          borderWidth: 1,
          padding: 12,
          bodyFont: {
            size: 12,
          },
          titleFont: {
            size: 13,
            weight: 600,
          },
          boxPadding: 6,
          usePointStyle: true,
        },
      },
      scales: {
        x: {
          type: 'time' as const,
          time: {
            unit: 'minute' as const,
            tooltipFormat: 'PPpp',
            displayFormats: {
              minute: 'h:mm a',
            },
          },
          title: {
            display: true,
            text: 'Time',
            font: {
              size: 13,
              weight: 600,
            },
            padding: { top: 10, bottom: 0 },
          },
          grid: {
            display: true,
            color: 'rgba(229, 231, 235, 0.5)',
          },
          ticks: {
            font: {
              size: 11,
            },
          },
        },
        'y-hr': {
          type: 'linear' as const,
          display: true,
          position: 'left' as const,
          title: {
            display: true,
            text: 'Heart Rate (bpm)',
            font: {
              size: 13,
              weight: 600,
            },
          },
          grid: {
            color: 'rgba(229, 231, 235, 0.5)',
          },
          ticks: {
            font: {
              size: 11,
            },
          },
          min: 40,
          max: 120,
          beginAtZero: false,
        },
        'y-bp': {
          type: 'linear' as const,
          display: true,
          position: 'right' as const,
          title: {
            display: true,
            text: 'Blood Pressure (mmHg)',
            font: {
              size: 13,
              weight: 600,
            },
          },
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            font: {
              size: 11,
            },
          },
          min: 40,
          max: 180,
        },
        'y-spo2': {
          type: 'linear' as const,
          display: true,
          position: 'right' as const,
          title: {
            display: true,
            text: 'SpO2 (%)',
            font: {
              size: 13,
              weight: 600,
            },
          },
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            font: {
              size: 11,
            },
          },
          min: 85,
          max: 100,
        },
      },
    };

    return (
      <>
        {/* Enhanced Summary Cards */}
        <DashboardSummaryCards
          totalPatients={0}
          criticalAlerts={patientSpecificAlerts.length}
          anomalies={2}
          healthRecords={myVitalsDisplay.length}
          userRole="PATIENT"
        />
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Live Vitals Card */}
          <div className="lg:col-span-1">
            <LiveVitalsCard />
          </div>
          
          {/* Vital Signs Chart */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Vital Signs Trend</h2>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setUseFakeData(v => !v)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-300 ${
                      useFakeData 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {useFakeData ? '🔄 Demo' : '📊 Real'}
                  </button>
                  <span className="text-sm text-gray-500">
                    Last: {lastVital?.timestamp ? format(new Date(lastVital.timestamp), 'h:mm a') : 'N/A'}
                  </span>
                  <div className={`h-3 w-3 rounded-full ${useFakeData ? 'bg-green-500 animate-pulse' : 'bg-blue-500'} shadow-lg`}></div>
                </div>
              </div>
              <div className="h-[400px] bg-gradient-to-br from-gray-50 to-indigo-50/20 rounded-xl p-4">
                <Line data={vitalSignsData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* Latest Measurements & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Latest Measurements */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Latest Measurements</h2>
              <div className="p-2 bg-green-50 rounded-lg">
                <HeartIcon className="h-5 w-5 text-green-600" />
              </div>
            </div>
            {lastVital ? (
              <div className="space-y-6">
                <VitalSignCard
                  title="Heart Rate"
                  value={lastVital.heartRate}
                  unit="bpm"
                  normalRange="60-100 bpm"
                  isAbnormal={!!lastVital.heartRate && (lastVital.heartRate > 100 || lastVital.heartRate < 60)}
                  icon={<HeartIcon className="h-5 w-5" />}
                />

                <VitalSignCard
                  title="Blood Pressure"
                  value={lastVital.systolic && lastVital.diastolic ? lastVital.systolic : undefined}
                  unit={`/${lastVital.diastolic} mmHg`}
                  normalRange="90-140/60-90 mmHg"
                  isAbnormal={!!(lastVital.systolic && lastVital.diastolic) && (lastVital.systolic > 140 || lastVital.diastolic > 90)}
                  icon={<BloodPressureIcon className="h-5 w-5" />}
                />
                
                <VitalSignCard
                  title="Temperature"
                  value={lastVital.temperature}
                  unit="°C"
                  normalRange="36.5-37.5 °C"
                  isAbnormal={!!lastVital.temperature && (lastVital.temperature > 37.5 || lastVital.temperature < 36.5)}
                  icon={<ThermometerIcon className="h-5 w-5" />}
                />

                <VitalSignCard
                  title="Oxygen Saturation"
                  value={lastVital.oxygenSaturation}
                  unit="%"
                  normalRange="≥95%"
                  isAbnormal={!!lastVital.oxygenSaturation && lastVital.oxygenSaturation < 95}
                  icon={<OxygenIcon className="h-5 w-5" />}
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">No recent measurements</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  Add Measurements
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Quick Actions</h2>
              <div className="p-2 bg-purple-50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Monitor Patients</p>
                    <p className="text-xs text-blue-100">Select Patients</p>
                  </div>
                </div>
              </button>
              
              <Link
                to="/messaging"
                className="p-4 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-xl hover:from-purple-600 hover:to-violet-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 group block"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Messaging</p>
                    <p className="text-xs text-purple-100">Patient communication</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Patient Alerts Section */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">My Alerts</h2>
            <div className="p-2 bg-yellow-50 rounded-lg">
              <SummaryAlertsIcon className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
          <div className="flex flex-col space-y-3">
            {patientSpecificAlerts.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">No alerts - everything looks good!</p>
              </div>
            ) : (
              patientSpecificAlerts.map(alert => (
                <div key={alert.id} className="p-4 rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50/30 border border-yellow-200 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                      <div className="text-sm font-medium text-yellow-800">
                        {alert.type}
                      </div>
                    </div>
                    <div className="text-xs text-yellow-600">
                      {alert.timestamp ? format(new Date(alert.timestamp), 'PPpp', { locale: enUS }) : 'Unknown time'}
                    </div>
                  </div>
                  <div className="text-sm text-yellow-700 ml-4">
                    {alert.message}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </>
    );
  };

  const renderAdminDoctorDashboard = () => {
    const today = new Date();
    const formattedDate = format(today, 'dd MMMM yyyy, EEEE', { locale: enUS });
    const userFullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'User';

  return (
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="p-8 bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg rounded-2xl mb-8">
          <h1 className="text-3xl font-bold text-white">Welcome, {userFullName}! 👋</h1>
          <p className="text-blue-100">{formattedDate}</p>
          {user?.role === 'DOCTOR' && user.doctor_code && (
            <div className="mt-4">
              <p className="text-white">Your code: <span className="font-bold bg-white text-indigo-600 px-2 py-1 rounded">{user.doctor_code}</span></p>
            </div>
          )}
      </div>

        {user && <div className="mb-8">
          <DashboardSummaryCards
            totalPatients={patients.length}
                criticalAlerts={allSystemAlerts.length}
                anomalies={2} // Placeholder for now
            healthRecords={healthRecordsActivity.reduce((sum, item) => sum + item.count, 0)}
                userRole={user.role}
            />
        </div>}

        {/* Quick Actions - This section will be removed */}
        {/* 
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Link
              to="/patients/add" 
              className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-105 group"
            >
              <div className="flex items-center space-x-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 group-hover:from-blue-100 group-hover:to-indigo-100 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Add Patient</p>
                  <p className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">New Registration</p>
                </div>
              </div>
            </Link>
            <button
              onClick={() => setIsMonitorModalOpen(true)}
              className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-105 group"
            >
              <div className="flex items-center space-x-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 text-purple-600 group-hover:from-purple-100 group-hover:to-violet-100 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Monitor</p>
                  <p className="text-lg font-bold text-gray-800 group-hover:text-purple-600 transition-colors">Select Patients</p>
                </div>
              </div>
            </button>
            <Link
              to="/messaging"
              className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-105 group"
            >
              <div className="flex items-center space-x-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50 text-pink-600 group-hover:from-pink-100 group-hover:to-rose-100 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Messaging</p>
                  <p className="text-lg font-bold text-gray-800 group-hover:text-pink-600 transition-colors">Patient Communication</p>
                </div>
              </div>
            </Link>
            <Link
              to="/patient-notes"
              className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-105 group"
            >
              <div className="flex items-center space-x-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 text-orange-600 group-hover:from-orange-100 group-hover:to-red-100 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Clinical Notes</p>
                  <p className="text-lg font-bold text-gray-800 group-hover:text-orange-600 transition-colors">Add Patient Notes</p>
                </div>
              </div>
            </Link>
          </div>
        */}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Health Records Chart - REMOVED */}
          </div>
          </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Patient view - Personal dashboard */}
      {user?.role === 'PATIENT' && renderPatientDashboard()}

      {/* Doctor/Admin view - Overview dashboard */}
      {(user?.role === 'DOCTOR' || user?.role === 'ADMIN') && renderAdminDoctorDashboard()}
      
      {/* Modals */}

      {/* Modal for Adding Vital Signs (Patient only) */}
      {user?.role === 'PATIENT' && (
        <div>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800">Add Vital Signs</h2>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="heartRate" className="block text-sm font-medium text-gray-700 mb-2">
                        Heart Rate (bpm)
                      </label>
                      <input 
                        type="number"
                        id="heartRate"
                        name="heartRate"
                        value={newVitals.heartRate}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="e.g., 75"
                      />
                    </div>
                    <div>
                      <label htmlFor="bloodPressureSystolic" className="block text-sm font-medium text-gray-700 mb-2">
                        Systolic (mmHg)
                      </label>
                      <input 
                        type="number"
                        id="bloodPressureSystolic"
                        name="bloodPressureSystolic"
                        value={newVitals.bloodPressureSystolic}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="e.g., 120"
                      />
                    </div>
                    <div>
                      <label htmlFor="bloodPressureDiastolic" className="block text-sm font-medium text-gray-700 mb-2">
                        Diastolic (mmHg)
                      </label>
                      <input 
                        type="number"
                        id="bloodPressureDiastolic"
                        name="bloodPressureDiastolic"
                        value={newVitals.bloodPressureDiastolic}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="e.g., 80"
                      />
                    </div>
                    <div>
                      <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 mb-2">
                        Temperature (°C)
                      </label>
                      <input 
                        type="number"
                        id="temperature"
                        name="temperature"
                        value={newVitals.temperature}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="e.g., 37.0"
                        step="0.1"
                      />
                    </div>
                    <div className="col-span-2">
                      <label htmlFor="oxygenSaturation" className="block text-sm font-medium text-gray-700 mb-2">
                        Oxygen Saturation (%)
                      </label>
                      <input 
                        type="number"
                        id="oxygenSaturation"
                        name="oxygenSaturation"
                        value={newVitals.oxygenSaturation}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="e.g., 98"
                      />
                    </div>
                  </div>
                  
                  {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-red-600">{error}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Save Vitals
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Monitor Patients Modal (Doctor/Admin) */}
      <MonitorPatientsModal
        isOpen={isMonitorModalOpen}
        onClose={() => setIsMonitorModalOpen(false)}
        onSave={setMonitoredPatientIds}
        initiallySelectedIds={monitoredPatientIds}
      />
    </div>
  );
};

export default DashboardPage;
