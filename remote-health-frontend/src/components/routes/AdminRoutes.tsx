import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AuthGuard from '../AuthGuard';
import Layout from '../Layout';
import { UserRole } from '../../types/auth';
import AdminDashboardPage from '../../pages/AdminDashboardPage';
import PatientListPage from '../../pages/PatientListPage';
import PatientDetailPage from '../../pages/PatientDetailPage';
import PatientAddPage from '../../pages/PatientAddPage';
import ClinicalOverviewDashboardPage from '../../pages/ClinicalOverviewDashboardPage';
import MessagingPage from '../../pages/MessagingPage';
import NotificationsPage from '../../pages/NotificationsPage';
import SettingsPage from '../../pages/SettingsPage';
import AnomaliesPage from '../../pages/AnomaliesPage';
import AllAlertsPage from '../../pages/AllAlertsPage';

const AdminRoutes: React.FC = () => {
  return (
    <>
      {/* Admin Dashboard */}
      <Route 
        path="/admin/dashboard" 
        element={
          <AuthGuard allowedRoles={['ADMIN' as UserRole]}>
            <Layout><AdminDashboardPage /></Layout>
          </AuthGuard>
        }
      />
      
      {/* Admin can access all patient management features */}
      <Route 
        path="/admin/patients" 
        element={
          <AuthGuard allowedRoles={['ADMIN' as UserRole]}>
            <Layout><PatientListPage /></Layout>
          </AuthGuard>
        }
      />
      
      <Route 
        path="/admin/patients/:id" 
        element={
          <AuthGuard allowedRoles={['ADMIN' as UserRole]}>
            <Layout><PatientDetailPage /></Layout>
          </AuthGuard>
        }
      />
      
      <Route 
        path="/admin/patients/new" 
        element={
          <AuthGuard allowedRoles={['ADMIN' as UserRole]}>
            <Layout><PatientAddPage /></Layout>
          </AuthGuard>
        }
      />
      
      <Route 
        path="/admin/health-records" 
        element={
          <AuthGuard allowedRoles={['ADMIN' as UserRole]}>
            <Layout><ClinicalOverviewDashboardPage /></Layout>
          </AuthGuard>
        }
      />
      
      <Route 
        path="/admin/anomalies" 
        element={
          <AuthGuard allowedRoles={['ADMIN' as UserRole]}>
            <Layout><AnomaliesPage /></Layout>
          </AuthGuard>
        }
      />
      
      <Route 
        path="/admin/alerts" 
        element={
          <AuthGuard allowedRoles={['ADMIN' as UserRole]}>
            <Layout><AllAlertsPage /></Layout>
          </AuthGuard>
        }
      />
      
      {/* Admin-specific routes */}
      <Route 
        path="/admin/messaging" 
        element={
          <AuthGuard allowedRoles={['ADMIN' as UserRole]}>
            <Layout><MessagingPage /></Layout>
          </AuthGuard>
        }
      />
      
      <Route 
        path="/admin/notifications" 
        element={
          <AuthGuard allowedRoles={['ADMIN' as UserRole]}>
            <Layout><NotificationsPage /></Layout>
          </AuthGuard>
        }
      />
      
      <Route 
        path="/admin/settings" 
        element={
          <AuthGuard allowedRoles={['ADMIN' as UserRole]}>
            <Layout><SettingsPage /></Layout>
          </AuthGuard>
        }
      />
    </>
  );
};

export default AdminRoutes;
