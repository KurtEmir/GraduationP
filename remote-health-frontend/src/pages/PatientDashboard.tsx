import React, { useEffect, useState, useCallback, useRef } from 'react';
import { patientService } from '../services/patient';
import { alertService } from '../services/alertService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Patient, VitalSigns } from '../types/patient';
import { Alert as AlertType } from '../types/alert';
import {
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

const PatientDashboard: React.FC = () => {
  const [myVitalsDisplay, setMyVitalsDisplay] = useState<VitalSigns[]>([]);
  const [lastVital, setLastVital] = useState<VitalSigns | null>(null);
  const [patientSpecificAlerts, setPatientSpecificAlerts] = useState<AlertType[]>([]);
  const [patientDetails, setPatientDetails] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useFakeData, setUseFakeData] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const fakeDataIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Modal State for Patient's Add Vital Signs
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newVitals, setNewVitals] = useState<{
    heartRate: string;
    bloodPressureSystolic: string;
    bloodPressureDiastolic: string;
    temperature: string;
    oxygenSaturation: string;
  }>({
    heartRate: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    temperature: '',
    oxygenSaturation: '',
  });

  const fetchPatientData = useCallback(async (currentUserId: number, currentUserEmail: string) => {
    if (!user || user.role !== 'PATIENT') {
      console.log('PatientDashboard: User is not a patient, redirecting...');
      navigate('/dashboard');
      return;
    }
    
    let profileData: Patient | null = null;
    let fetchErrorOccurred = false;

    try {
      profileData = await patientService.getCurrentPatientProfile();
    } catch (err) {
      console.error('PatientDashboard: Error fetching patient profile:', err); 
      setError('Failed to fetch patient profile.');
      fetchErrorOccurred = true;
    }

    if (profileData && profileData.id) {
      setPatientDetails(profileData);
      setError(null);
      
      try {
        const vitalsData = await patientService.getVitalSigns(currentUserId);
        setMyVitalsDisplay(vitalsData);
        setLastVital(vitalsData.length > 0 ? vitalsData.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())[0] : null);

        const patientAlertsData = await alertService.getAlertsByPatientId(currentUserId);
        setPatientSpecificAlerts(patientAlertsData);
      } catch (dataFetchError) {
        console.error("PatientDashboard: Error fetching vitals or alerts:", dataFetchError);
        setError('Failed to fetch patient data (vitals/alerts).');
      }
    } else {
      if (!fetchErrorOccurred) {
        setError('Patient profile not found. Please contact your healthcare provider to create your profile.');
      }
      setLastVital(null);
      setMyVitalsDisplay([]);
      setPatientSpecificAlerts([]);
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user && user.id && user.email && user.role === 'PATIENT') {
      setLoading(true);
      setError(null);
      
      const loadPatientData = async () => {
        await fetchPatientData(user.id, user.email);
        setLoading(false);
      };
      
      loadPatientData();
    } else if (user && user.role !== 'PATIENT') {
      navigate('/dashboard');
    } else if (!user) {
      setLoading(false);
      setPatientDetails(null);
      setMyVitalsDisplay([]);
      setLastVital(null);
      setPatientSpecificAlerts([]);
    }
  }, [user, fetchPatientData, navigate]);

  // Live fake data polling for demo/testing
  useEffect(() => {
    if (user?.role === 'PATIENT' && useFakeData) {
      const updateFakeVitals = () => {
        const fakeVital = patientService.getLiveFakeVitals();
        setLastVital(fakeVital);
        setMyVitalsDisplay(prev => {
          const newVitals = [...prev.slice(-39), fakeVital];
          return newVitals;
        });
      };
      
      updateFakeVitals();
      const intervalId = setInterval(updateFakeVitals, 2000);
      fakeDataIntervalRef.current = intervalId;
      
      return () => {
        if (intervalId) {
          clearInterval(intervalId);
          fakeDataIntervalRef.current = null;
        }
      };
    } else {
      if (fakeDataIntervalRef.current) {
        clearInterval(fakeDataIntervalRef.current);
        fakeDataIntervalRef.current = null;
      }
    }
  }, [user, useFakeData]);

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
        };
        await patientService.addVitalSigns(user.id as number, vitalDataToSubmit);
        setIsModalOpen(false);
        setNewVitals({
            heartRate: '',
            bloodPressureSystolic: '',
            bloodPressureDiastolic: '',
            temperature: '',
            oxygenSaturation: '',
        });
        fetchPatientData(user.id as number, user.email!);
      } catch (err) {
        console.error("Failed to add vital signs:", err);
        setError('Failed to add vital signs. Please check the values and try again.');
      }
    }
  };

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
      </div>
    );
  }



  // Create chart data for vital signs
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-6 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-48 h-48 bg-gradient-to-br from-emerald-400/10 to-blue-500/10 rounded-full blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-40 left-1/3 w-40 h-40 bg-gradient-to-br from-pink-400/10 to-purple-500/10 rounded-full blur-xl animate-pulse" style={{animationDelay: '4s'}}></div>
        <div className="absolute bottom-20 right-10 w-36 h-36 bg-gradient-to-br from-yellow-400/10 to-orange-500/10 rounded-full blur-xl animate-pulse" style={{animationDelay: '6s'}}></div>
        
        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/20 rounded-full animate-bounce" style={{animationDelay: '1s', animationDuration: '3s'}}></div>
        <div className="absolute top-3/4 right-1/3 w-3 h-3 bg-purple-400/20 rounded-full animate-bounce" style={{animationDelay: '2.5s', animationDuration: '4s'}}></div>
        <div className="absolute top-1/2 left-1/5 w-1.5 h-1.5 bg-emerald-400/20 rounded-full animate-bounce" style={{animationDelay: '0.5s', animationDuration: '2.5s'}}></div>
      </div>

      {/* Ultra-Modern Header Section - Responsive */}
      <div className="relative mb-6 sm:mb-8 p-4 sm:p-6 lg:p-8 bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden backdrop-blur-sm transform hover:scale-[1.01] transition-all duration-500">
        {/* Enhanced Animated Background Patterns */}
        <div className="absolute inset-0 bg-white/10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/3 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
        
        {/* Floating geometric shapes */}
        <div className="absolute top-4 right-1/4 w-8 h-8 border-2 border-white/20 rounded rotate-45 animate-spin" style={{animationDuration: '8s'}}></div>
        <div className="absolute bottom-4 left-1/3 w-6 h-6 bg-white/10 transform rotate-12 animate-pulse"></div>
        
        {/* Content - Responsive */}
        <div className="relative z-10">
          <div className="flex flex-col space-y-6 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center transform hover:scale-110 transition-all duration-300">
                  <span className="text-xl sm:text-2xl animate-pulse">👋</span>
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight bg-gradient-to-r from-white to-purple-100 bg-clip-text leading-tight">
                    Welcome back, {userFullName}!
                  </h1>
                  <p className="text-purple-100 text-base sm:text-lg font-medium mt-1">
                    {formattedDate}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-3 sm:px-4 py-2 border border-white/20 transform hover:scale-105 transition-all duration-300">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white text-xs sm:text-sm font-medium">Health Monitor Active</span>
                </div>
                <button
                  onClick={() => setUseFakeData(v => !v)}
                  className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 backdrop-blur-sm transform hover:scale-105 ${
                    useFakeData 
                      ? 'bg-white/20 text-white hover:bg-white/30 border border-white/30 shadow-lg' 
                      : 'bg-emerald-500/80 text-white hover:bg-emerald-600/80 border border-emerald-400/30 shadow-lg'
                  }`}
                >
                  <span className="hidden sm:inline">{useFakeData ? '🔄 Demo Mode' : '📊 Real Data'}</span>
                  <span className="sm:hidden">{useFakeData ? '🔄 Demo' : '📊 Real'}</span>
                </button>
                {lastVital?.timestamp && (
                  <div className="text-purple-100 text-xs sm:text-sm bg-white/10 backdrop-blur-sm rounded-full px-2 sm:px-3 py-1 transform hover:scale-105 transition-all duration-300">
                    <span className="hidden sm:inline">Last updated: {format(new Date(lastVital.timestamp), 'h:mm a')}</span>
                    <span className="sm:hidden">{format(new Date(lastVital.timestamp), 'h:mm a')}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Enhanced Beautiful Stats Cards - Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 sm:p-4 text-center border border-white/20 transform hover:scale-110 transition-all duration-300 hover:bg-white/30 group">
                <div className="text-2xl sm:text-3xl font-bold text-white group-hover:scale-110 transition-transform duration-300">{lastVital?.heartRate || '--'}</div>
                <div className="text-purple-100 text-xs font-medium">Heart Rate</div>
                <div className="text-purple-200 text-xs">bpm</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 sm:p-4 text-center border border-white/20 transform hover:scale-110 transition-all duration-300 hover:bg-white/30 group">
                <div className="text-2xl sm:text-3xl font-bold text-white group-hover:scale-110 transition-transform duration-300">{myVitalsDisplay.length}</div>
                <div className="text-purple-100 text-xs font-medium">Readings</div>
                <div className="text-purple-200 text-xs">total</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 sm:p-4 text-center border border-white/20 transform hover:scale-110 transition-all duration-300 hover:bg-white/30 group sm:col-span-2 lg:col-span-1">
                <div className="text-2xl sm:text-3xl font-bold text-white group-hover:scale-110 transition-transform duration-300">{patientSpecificAlerts.length}</div>
                <div className="text-purple-100 text-xs font-medium">Alerts</div>
                <div className="text-purple-200 text-xs">active</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="mb-8">
        <DashboardSummaryCards
          totalPatients={0}
          criticalAlerts={patientSpecificAlerts.length}
          anomalies={2}
          healthRecords={myVitalsDisplay.length}
          userRole="PATIENT"
        />
      </div>
      
      {/* Main Content Grid - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Live Vitals Card - Responsive */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <div className="transform hover:scale-[1.02] transition-all duration-300">
            <LiveVitalsCard />
          </div>
        </div>
        
        {/* Ultra-Fashionable Vital Signs Chart - Responsive */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          <div className="bg-white/80 backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/50 hover:shadow-3xl transition-all duration-500 hover:bg-white/90 transform hover:scale-[1.01] group relative overflow-hidden">
            {/* Subtle animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/30 to-indigo-50/30 rounded-2xl sm:rounded-3xl"></div>
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-400/5 to-purple-500/5 rounded-full blur-2xl group-hover:blur-xl transition-all duration-500"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="p-2 sm:p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-lg transform group-hover:scale-110 transition-all duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 bg-gradient-to-r from-gray-800 to-purple-600 bg-clip-text text-transparent">Vital Signs Trend</h2>
                    <p className="text-sm sm:text-base text-gray-500 font-medium">Real-time health monitoring</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-emerald-400 to-blue-500 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300">
                    Live Data
                  </div>
                  <div className={`h-3 w-3 rounded-full ${useFakeData ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'} shadow-lg`}></div>
                </div>
              </div>
              <div className="h-[300px] sm:h-[350px] lg:h-[420px] bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-indigo-50/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-100/50 backdrop-blur-sm relative overflow-hidden">
                {/* Chart background pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(99,102,241,0.03),transparent_50%)] rounded-2xl"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(168,85,247,0.03),transparent_50%)] rounded-2xl"></div>
                <div className="relative z-10">
                  <Line data={vitalSignsData} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Latest Measurements & Quick Actions - Ultra Modern Design - Responsive */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
        {/* Ultra-Fashionable Latest Measurements - Responsive */}
        <div className="bg-white/80 backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/50 hover:shadow-3xl transition-all duration-500 hover:bg-white/90 transform hover:scale-[1.01] group relative overflow-hidden">
          {/* Subtle animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-teal-50/30 to-blue-50/30 rounded-2xl sm:rounded-3xl"></div>
          <div className="absolute top-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-emerald-400/5 to-blue-500/5 rounded-full blur-2xl group-hover:blur-xl transition-all duration-500"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl sm:rounded-2xl shadow-lg transform group-hover:scale-110 transition-all duration-300">
                  <HeartIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 bg-gradient-to-r from-gray-800 to-emerald-600 bg-clip-text text-transparent">Latest Measurements</h2>
                  <p className="text-sm sm:text-base text-gray-500 font-medium">Your current health status</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-emerald-400 to-blue-500 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300">
                {lastVital ? 'Updated' : 'No Data'}
              </div>
            </div>
            {lastVital ? (
              <div className="space-y-6">
                <div className="transform hover:scale-[1.02] transition-all duration-300">
                  <VitalSignCard
                    title="Heart Rate"
                    value={lastVital.heartRate}
                    unit="bpm"
                    normalRange="60-100 bpm"
                    isAbnormal={!!lastVital.heartRate && (lastVital.heartRate > 100 || lastVital.heartRate < 60)}
                    icon={<HeartIcon className="h-5 w-5" />}
                  />
                </div>

                <div className="transform hover:scale-[1.02] transition-all duration-300">
                  <VitalSignCard
                    title="Blood Pressure"
                    value={lastVital.systolic && lastVital.diastolic ? lastVital.systolic : undefined}
                    unit={`/${lastVital.diastolic} mmHg`}
                    normalRange="90-140/60-90 mmHg"
                    isAbnormal={!!(lastVital.systolic && lastVital.diastolic) && (lastVital.systolic > 140 || lastVital.diastolic > 90)}
                    icon={<BloodPressureIcon className="h-5 w-5" />}
                  />
                </div>
                
                <div className="transform hover:scale-[1.02] transition-all duration-300">
                  <VitalSignCard
                    title="Temperature"
                    value={lastVital.temperature}
                    unit="°C"
                    normalRange="36.1-37.2°C"
                    isAbnormal={!!lastVital.temperature && (lastVital.temperature > 37.5 || lastVital.temperature < 36.0)}
                    icon={<ThermometerIcon className="h-5 w-5" />}
                  />
                </div>

                <div className="transform hover:scale-[1.02] transition-all duration-300">
                  <VitalSignCard
                    title="Oxygen Saturation"
                    value={lastVital.oxygenSaturation}
                    unit="%"
                    normalRange="95-100%"
                    isAbnormal={!!lastVital.oxygenSaturation && lastVital.oxygenSaturation < 95}
                    icon={<OxygenIcon className="h-5 w-5" />}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mb-6 transform hover:scale-110 transition-all duration-300">
                  <HeartIcon className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No vital signs yet</h3>
                <p className="text-gray-500 mb-6">Start your health journey by recording your first vital signs</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Add Your First Reading ✨
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Ultra-Fashionable Quick Actions - Responsive */}
        <div className="bg-white/80 backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/50 hover:shadow-3xl transition-all duration-500 hover:bg-white/90 transform hover:scale-[1.01] group relative overflow-hidden">
          {/* Subtle animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-pink-50/30 to-indigo-50/30 rounded-2xl sm:rounded-3xl"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-purple-400/5 to-pink-500/5 rounded-full blur-2xl group-hover:blur-xl transition-all duration-500"></div>
          
          <div className="relative z-10">
            <div className="flex items-center space-x-3 sm:space-x-4 mb-6 sm:mb-8">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl sm:rounded-2xl shadow-lg transform group-hover:scale-110 transition-all duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 bg-gradient-to-r from-gray-800 to-purple-600 bg-clip-text text-transparent">Quick Actions</h2>
                <p className="text-sm sm:text-base text-gray-500 font-medium">Manage your health data</p>
              </div>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full p-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-4 transform hover:scale-[1.02] group/btn relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 transform -skew-x-12 translate-x-full group-hover/btn:-translate-x-full transition-transform duration-1000"></div>
                <div className="p-3 bg-white/20 rounded-xl group-hover/btn:bg-white/30 transition-all duration-300 z-10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="text-left z-10">
                  <div className="font-bold text-lg">Log Health Data</div>
                  <div className="text-emerald-100 text-sm">Record your vital signs</div>
                </div>
              </button>

              <button
                onClick={() => navigate('/my-vitals-history')}
                className="w-full p-5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-4 transform hover:scale-[1.02] group/btn relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 transform -skew-x-12 translate-x-full group-hover/btn:-translate-x-full transition-transform duration-1000"></div>
                <div className="p-3 bg-white/20 rounded-xl group-hover/btn:bg-white/30 transition-all duration-300 z-10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="text-left z-10">
                  <div className="font-bold text-lg">View Health History</div>
                  <div className="text-blue-100 text-sm">Track your progress</div>
                </div>
              </button>

              <button
                onClick={() => navigate('/profile-settings')}
                className="w-full p-5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-2xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-4 transform hover:scale-[1.02] group/btn relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 transform -skew-x-12 translate-x-full group-hover/btn:-translate-x-full transition-transform duration-1000"></div>
                <div className="p-3 bg-white/20 rounded-xl group-hover/btn:bg-white/30 transition-all duration-300 z-10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="text-left z-10">
                  <div className="font-bold text-lg">Profile Settings</div>
                  <div className="text-purple-100 text-sm">Update your information</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ultra-Modern Add Vitals Modal - Responsive */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="p-4 sm:p-6 lg:p-8 border-b border-gray-100/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Add Vital Signs</h2>
                    <p className="text-sm sm:text-base text-gray-500 font-medium">Record your current health metrics</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 sm:p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl sm:rounded-2xl transition-all duration-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 lg:p-8">
              <form onSubmit={handleFormSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <label htmlFor="heartRate" className="block text-sm font-semibold text-gray-700 mb-3">
                      ❤️ Heart Rate (bpm)
                    </label>
                    <input 
                      type="number"
                      id="heartRate"
                      name="heartRate"
                      value={newVitals.heartRate}
                      onChange={handleInputChange}
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 group-hover:border-gray-300 bg-gradient-to-br from-white to-gray-50"
                      placeholder="e.g., 72"
                    />
                  </div>
                  <div className="group">
                    <label htmlFor="bloodPressureSystolic" className="block text-sm font-semibold text-gray-700 mb-3">
                      🩸 Systolic (mmHg)
                    </label>
                    <input 
                      type="number"
                      id="bloodPressureSystolic"
                      name="bloodPressureSystolic"
                      value={newVitals.bloodPressureSystolic}
                      onChange={handleInputChange}
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-300 group-hover:border-gray-300 bg-gradient-to-br from-white to-gray-50"
                      placeholder="e.g., 120"
                    />
                  </div>
                  <div className="group">
                    <label htmlFor="bloodPressureDiastolic" className="block text-sm font-semibold text-gray-700 mb-3">
                      🩸 Diastolic (mmHg)
                    </label>
                    <input 
                      type="number"
                      id="bloodPressureDiastolic"
                      name="bloodPressureDiastolic"
                      value={newVitals.bloodPressureDiastolic}
                      onChange={handleInputChange}
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all duration-300 group-hover:border-gray-300 bg-gradient-to-br from-white to-gray-50"
                      placeholder="e.g., 80"
                    />
                  </div>
                  <div className="group">
                    <label htmlFor="temperature" className="block text-sm font-semibold text-gray-700 mb-3">
                      🌡️ Temperature (°C)
                    </label>
                    <input 
                      type="number"
                      step="0.1"
                      id="temperature"
                      name="temperature"
                      value={newVitals.temperature}
                      onChange={handleInputChange}
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 group-hover:border-gray-300 bg-gradient-to-br from-white to-gray-50"
                      placeholder="e.g., 36.5"
                    />
                  </div>
                  <div className="group">
                    <label htmlFor="oxygenSaturation" className="block text-sm font-semibold text-gray-700 mb-3">
                      🫁 Oxygen Saturation (%)
                    </label>
                    <input 
                      type="number"
                      id="oxygenSaturation"
                      name="oxygenSaturation"
                      value={newVitals.oxygenSaturation}
                      onChange={handleInputChange}
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 group-hover:border-gray-300 bg-gradient-to-br from-white to-gray-50"
                      placeholder="e.g., 98"
                    />
                  </div>
                </div>
                
                {error && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-100 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-red-700">{error}</span>
                    </div>
                  </div>
                )}
                
                <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 sm:px-6 py-3 sm:py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl sm:rounded-2xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl sm:rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  >
                    Save Vitals ✨
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
