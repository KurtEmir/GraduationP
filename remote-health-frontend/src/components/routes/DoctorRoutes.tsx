import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AuthGuard from '../AuthGuard';
import Layout from '../Layout';
import { UserRole } from '../../types/auth';
import ClinicalOverviewDashboardPage from '../../pages/ClinicalOverviewDashboardPage';
import PatientListPage from '../../pages/PatientListPage';
import PatientDetailPage from '../../pages/PatientDetailPage';
import PatientAddPage from '../../pages/PatientAddPage';
import DoctorNotesPage from '../../pages/DoctorNotesPage';
import HealthMapPage from '../../pages/HealthMapPage';
import MessagingPage from '../../pages/MessagingPage';
import NotificationsPage from '../../pages/NotificationsPage';
import SettingsPage from '../../pages/SettingsPage';
import AnomaliesPage from '../../pages/AnomaliesPage';
import AllAlertsPage from '../../pages/AllAlertsPage';

const DoctorRoutes: React.FC = () => {
  return (
    <>
      {/* Doctor Dashboard - Clinical Overview */}
      <Route 
        path="/doctor/dashboard" 
        element={
          <AuthGuard allowedRoles={['DOCTOR' as UserRole]}>
            <Layout><ClinicalOverviewDashboardPage /></Layout>
          </AuthGuard>
        }
      />
      
      <Route 
        path="/health-records" 
        element={
          <AuthGuard allowedRoles={['DOCTOR' as UserRole]}>
            <Layout><ClinicalOverviewDashboardPage /></Layout>
          </AuthGuard>
        }
      />
      
      {/* Patient Management Routes */}
      <Route 
        path="/patients" 
        element={
          <AuthGuard allowedRoles={['DOCTOR' as UserRole]}>
            <Layout><PatientListPage /></Layout>
          </AuthGuard>
        }
      />
      
      <Route 
        path="/patients/new" 
        element={
          <AuthGuard allowedRoles={['DOCTOR' as UserRole]}>
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
      
      {/* Doctor-specific features */}
      <Route 
        path="/doctor-notes" 
        element={
          <AuthGuard allowedRoles={['DOCTOR' as UserRole]}>
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
        path="/doctor/anomalies" 
        element={
          <AuthGuard allowedRoles={['DOCTOR' as UserRole]}>
            <Layout><AnomaliesPage /></Layout>
          </AuthGuard>
        }
      />
      
      <Route 
        path="/doctor/alerts" 
        element={
          <AuthGuard allowedRoles={['DOCTOR' as UserRole]}>
            <Layout><AllAlertsPage /></Layout>
          </AuthGuard>
        }
      />
      
      {/* Shared routes for doctors */}
      <Route 
        path="/doctor/messaging" 
        element={
          <AuthGuard allowedRoles={['DOCTOR' as UserRole]}>
            <Layout><MessagingPage /></Layout>
          </AuthGuard>
        }
      />
      
      <Route 
        path="/doctor/notifications" 
        element={
          <AuthGuard allowedRoles={['DOCTOR' as UserRole]}>
            <Layout><NotificationsPage /></Layout>
          </AuthGuard>
        }
      />
      
      <Route 
        path="/doctor/settings" 
        element={
          <AuthGuard allowedRoles={['DOCTOR' as UserRole]}>
            <Layout><SettingsPage /></Layout>
          </AuthGuard>
        }
      />
    </>
  );
};

export default DoctorRoutes;
