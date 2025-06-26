import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PatientProfileErrorPage from './pages/PatientProfileErrorPage';
import PatientDashboard from './pages/PatientDashboard';
import DashboardPage from './pages/DashboardPage';
import PatientListPage from './pages/PatientListPage';
import PatientDetailPage from './pages/PatientDetailPage';
import PatientAddPage from './pages/PatientAddPage';
import MyVitalsHistoryPage from './pages/MyVitalsHistoryPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import MessagingPage from './pages/MessagingPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import AnomaliesPage from './pages/AnomaliesPage';
import AllAlertsPage from './pages/AllAlertsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ClinicalOverviewDashboardPage from './pages/ClinicalOverviewDashboardPage';
import DoctorNotesPage from './pages/DoctorNotesPage';
import HealthMapPage from './pages/HealthMapPage';
import AuthGuard from './components/AuthGuard';
import Layout from './components/Layout';
import { UserRole } from './types/auth';
import DataEntryPage from './pages/DataEntryPage';
import DiseaseThresholdsPage from './pages/DiseaseThresholdsPage';
import DataSimulatorPage from './pages/DataSimulatorPage';
import SelectPatientForNotesPage from './pages/SelectPatientForNotesPage';

// Role-based redirect component
const RoleBasedRedirect: React.FC = () => {
  const { user } = useAuth();
  
  if (user?.role === 'PATIENT') {
    return <Navigate to="/patient-dashboard" replace />;
  } else if (user?.role === 'DOCTOR' || user?.role === 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Navigate to="/dashboard" replace />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            {/* Public routes - No Layout */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Error pages */}
            <Route path="/patient-profile-error" element={<PatientProfileErrorPage />} />
            
            {/* Separate Patient Dashboard */}
            <Route 
              path="/patient-dashboard" 
              element={
                <AuthGuard allowedRoles={['PATIENT' as UserRole]}>
                  <Layout><PatientDashboard /></Layout>
                </AuthGuard>
              }
            />

            {/* General Dashboard (for doctors/admins) */}
            <Route 
              path="/dashboard" 
              element={
                <AuthGuard allowedRoles={['DOCTOR' as UserRole, 'ADMIN' as UserRole]}>
                  <Layout><DashboardPage /></Layout>
                </AuthGuard>
              }
            />

            {/* Root redirect based on role */}
            <Route 
              path="/" 
              element={
                <AuthGuard>
                  <RoleBasedRedirect />
                </AuthGuard>
              }
            />

            {/* PATIENT ROUTES */}
            <Route 
              path="/my-vitals-history" 
              element={
                <AuthGuard allowedRoles={['PATIENT' as UserRole]}>
                  <Layout><MyVitalsHistoryPage /></Layout>
                </AuthGuard>
              }
            />
            <Route 
              path="/profile-settings" 
              element={
                <AuthGuard allowedRoles={['PATIENT' as UserRole]}>
                  <Layout><ProfileSettingsPage /></Layout>
                </AuthGuard>
              }
            />
            {/* Data Entry Route for Patients */}
            <Route 
              path="/data-entry" 
              element={
                <AuthGuard allowedRoles={['PATIENT' as UserRole]}>
                  <Layout><DataEntryPage /></Layout>
                </AuthGuard>
              }
            />

            {/* DOCTOR ROUTES */}
            <Route 
              path="/patients" 
              element={
                <AuthGuard allowedRoles={['DOCTOR' as UserRole, 'ADMIN' as UserRole]}>
                  <Layout><PatientListPage /></Layout>
                </AuthGuard>
              }
            />
            <Route 
              path="/patient-add" 
              element={
                <AuthGuard allowedRoles={['DOCTOR' as UserRole, 'ADMIN' as UserRole]}>
                  <Layout><PatientAddPage /></Layout>
                </AuthGuard>
              }
            />
            <Route 
              path="/patients/:id" 
              element={
                <AuthGuard allowedRoles={['DOCTOR' as UserRole]}>
                  <Layout><PatientDetailPage /></Layout>
                </AuthGuard>
              }
            />
            <Route 
              path="/select-patient-for-notes" 
              element={
                <AuthGuard allowedRoles={['DOCTOR' as UserRole, 'ADMIN' as UserRole]}>
                  <Layout><SelectPatientForNotesPage /></Layout>
                </AuthGuard>
              }
            />
            <Route 
              path="/doctor-notes/:id" 
              element={
                <AuthGuard allowedRoles={['DOCTOR' as UserRole, 'ADMIN' as UserRole]}>
                  <Layout><DoctorNotesPage /></Layout>
                </AuthGuard>
              }
            />
            <Route 
              path="/health-map" 
              element={
                <AuthGuard allowedRoles={['DOCTOR' as UserRole]}>
                  <Layout><HealthMapPage /></Layout>
                </AuthGuard>
              }
            />
            <Route 
              path="/health-records" 
              element={
                <AuthGuard allowedRoles={['DOCTOR' as UserRole, 'ADMIN' as UserRole]}>
                  <Layout><ClinicalOverviewDashboardPage /></Layout>
                </AuthGuard>
              }
            />

            {/* ADMIN ROUTES */}
            <Route 
              path="/admin/dashboard" 
              element={
                <AuthGuard allowedRoles={['ADMIN' as UserRole]}>
                  <Layout><AdminDashboardPage /></Layout>
                </AuthGuard>
              }
            />
            
            {/* Admin-only routes for system management */}
            <Route 
              path="/admin/disease-thresholds" 
              element={
                <AuthGuard allowedRoles={['ADMIN' as UserRole]}>
                  <Layout><DiseaseThresholdsPage /></Layout>
                </AuthGuard>
              }
            />
            
            <Route 
              path="/admin/data-simulator" 
              element={
                <AuthGuard allowedRoles={['ADMIN' as UserRole]}>
                  <Layout><DataSimulatorPage /></Layout>
                </AuthGuard>
              }
            />

            {/* SHARED ROUTES */}
            <Route 
              path="/messaging" 
              element={
                <AuthGuard>
                  <Layout><MessagingPage /></Layout>
                </AuthGuard>
              }
            />
            <Route 
              path="/notifications" 
              element={
                <AuthGuard>
                  <Layout><NotificationsPage /></Layout>
                </AuthGuard>
              }
            />
            <Route 
              path="/settings" 
              element={
                <AuthGuard>
                  <Layout><SettingsPage /></Layout>
                </AuthGuard>
              }
            />
            <Route 
              path="/anomalies" 
              element={
                <AuthGuard>
                  <Layout><AnomaliesPage /></Layout>
                </AuthGuard>
              }
            />
            <Route 
              path="/alerts" 
              element={
                <AuthGuard>
                  <Layout><AllAlertsPage /></Layout>
                </AuthGuard>
              }
            />

            {/* Fallback route for authenticated users */}
            <Route 
              path="*" 
              element={
                <AuthGuard>
                  <RoleBasedRedirect />
                </AuthGuard>
              }
            />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
