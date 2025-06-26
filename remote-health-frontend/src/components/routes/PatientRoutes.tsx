import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AuthGuard from '../AuthGuard';
import Layout from '../Layout';
import { UserRole } from '../../types/auth';
import DashboardPage from '../../pages/DashboardPage';
import MyVitalsHistoryPage from '../../pages/MyVitalsHistoryPage';
import ProfileSettingsPage from '../../pages/ProfileSettingsPage';
import MessagingPage from '../../pages/MessagingPage';
import NotificationsPage from '../../pages/NotificationsPage';
import SettingsPage from '../../pages/SettingsPage';
import AnomaliesPage from '../../pages/AnomaliesPage';
import AllAlertsPage from '../../pages/AllAlertsPage';

const PatientRoutes: React.FC = () => {
  return (
    <>
      {/* Patient Dashboard */}
      <Route 
        path="/dashboard" 
        element={
          <AuthGuard allowedRoles={['PATIENT' as UserRole]}>
            <Layout><DashboardPage /></Layout>
          </AuthGuard>
        }
      />
      
      {/* Patient-specific routes */}
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
      
      <Route 
        path="/patient/anomalies" 
        element={
          <AuthGuard allowedRoles={['PATIENT' as UserRole]}>
            <Layout><AnomaliesPage /></Layout>
          </AuthGuard>
        }
      />
      
      <Route 
        path="/patient/alerts" 
        element={
          <AuthGuard allowedRoles={['PATIENT' as UserRole]}>
            <Layout><AllAlertsPage /></Layout>
          </AuthGuard>
        }
      />
      
      {/* Shared routes for patients */}
      <Route 
        path="/patient/messaging" 
        element={
          <AuthGuard allowedRoles={['PATIENT' as UserRole]}>
            <Layout><MessagingPage /></Layout>
          </AuthGuard>
        }
      />
      
      <Route 
        path="/patient/notifications" 
        element={
          <AuthGuard allowedRoles={['PATIENT' as UserRole]}>
            <Layout><NotificationsPage /></Layout>
          </AuthGuard>
        }
      />
      
      <Route 
        path="/patient/settings" 
        element={
          <AuthGuard allowedRoles={['PATIENT' as UserRole]}>
            <Layout><SettingsPage /></Layout>
          </AuthGuard>
        }
      />
    </>
  );
};

export default PatientRoutes;
