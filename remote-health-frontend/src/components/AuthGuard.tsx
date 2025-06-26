import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><div>Loading authentication status...</div></div>;
  }

  if (!isAuthenticated || !user) {
    // Redirect to login if not authenticated or user is null
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to a general page (e.g., dashboard or an unauthorized page)
    // if user's role is not allowed.
    // Redirecting to "/" (dashboard) might be suitable as a default.
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard; 