import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';
import {
  DashboardIcon,
  HealthRecordsIcon,
  AnomaliesIcon,
  PatientsIcon,
  AlertsIcon,
  SettingsIcon,
  LogoutIcon,
  PlusIcon,
  ChatIcon
} from './icons';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, badge }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `group flex items-center justify-between px-4 py-3 mx-2 rounded-xl transition-all duration-200 ${
        isActive 
          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105' 
          : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md hover:scale-105'
      }`
    }
  >
    <div className="flex items-center space-x-3">
      <div className={`p-2 rounded-lg transition-colors duration-200 ${
        window.location.pathname === to
          ? 'bg-white/20' 
          : 'group-hover:bg-blue-100'
      }`}>
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
    {badge && badge > 0 && (
      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
        {badge > 99 ? '99+' : badge}
      </span>
    )}
  </NavLink>
);

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return `${first}${last}`.toUpperCase() || 'U';
  };
  
  const userRoleDisplay = user ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase() : 'User';

  if (!user) {
    return (
      <div className="w-72 bg-white shadow-2xl border-r border-gray-200 flex flex-col min-h-screen">
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <PlusIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">RHM System</h2>
              <p className="text-sm text-gray-500">Loading...</p>
            </div>
          </div>
        </div>
        <nav className="flex-grow px-4">
          <div className="animate-pulse space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </nav>
      </div>
    );
  }

  return (
    <div className="w-72 bg-white shadow-2xl border-r border-gray-200 flex flex-col min-h-screen">
      {/* Enhanced Header with Logo */}
      <div className="p-6 border-b border-gray-100">
        <Logo size="medium" showText={true} />
      </div>

      {/* Enhanced Navigation */}
      <nav className="flex-grow px-4 py-6 space-y-2">
        <div className="mb-6">
          <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            MAIN MENU
          </h3>
          <NavItem 
            to="/dashboard" 
            icon={<DashboardIcon className="h-5 w-5" />} 
            label="Dashboard" 
          />
          
          {/* Conditional Health Records Link */}
          {user?.role === 'PATIENT' ? (
            <NavItem 
              to="/my-vitals-history" 
              icon={<HealthRecordsIcon className="h-5 w-5" />} 
              label="My Health Records" 
            />
          ) : (
            <NavItem 
              to="/health-records" 
              icon={<HealthRecordsIcon className="h-5 w-5" />} 
              label="Health Records" 
            />
          )}
          
          <NavItem 
            to="/anomalies" 
            icon={<AnomaliesIcon className="h-5 w-5" />} 
            label="Anomalies" 
            badge={2}
          />
          
          {user?.role !== 'PATIENT' && (
            <NavItem 
              to="/patients" 
              icon={<PatientsIcon className="h-5 w-5" />} 
              label="Patients" 
            />
          )}
          
          <NavItem 
            to="/alerts" 
            icon={<AlertsIcon className="h-5 w-5" />} 
            label="Alerts" 
            badge={3}
          />
          
          <NavItem 
            to="/messaging" 
            icon={<ChatIcon className="h-5 w-5" />} 
            label="Messages" 
            badge={5}
          />
        </div>

        {/* Quick Actions Section */}
        {user?.role === 'PATIENT' && (
          <div className="mb-6">
            <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              QUICK ACTIONS
            </h3>
            <Link
              to="/data-entry"
              className="group flex items-center px-4 py-3 mx-2 rounded-xl transition-all duration-200 text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <div className="p-2 rounded-lg bg-white/20 mr-3">
                <PlusIcon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">Log Health Data</span>
            </Link>
          </div>
        )}

        <div>
          <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            SETTINGS
          </h3>
          <NavItem 
            to="/settings" 
            icon={<SettingsIcon className="h-5 w-5" />} 
            label="Settings" 
          />
        </div>
      </nav>

      {/* Logout Button Only - Profile removed */}
      <div className="border-t border-gray-100 p-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 border border-gray-200 hover:border-red-200 transition-all duration-200 group"
        >
          <LogoutIcon className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 