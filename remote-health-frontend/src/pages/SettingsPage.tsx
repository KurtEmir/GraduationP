import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  const getInitials = () => {
    if (!user) return '?';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  const getFullName = () => {
    if (!user) return 'Unknown User';
    const first = user.firstName || '';
    const last = user.lastName || '';
    return (first + ' ' + last).trim() || 'Unknown User';
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    // Password change logic will be added here (log for demo)
    console.log("Password change submitted");
    alert("Password change functionality is not implemented in this demo.");
  };

  // Simple toggle switch component (with Tailwind)
  const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void; label: string }> = 
    ({ enabled, onChange, label }) => (
    <label htmlFor={label.replace(/\s+/g, '-').toLowerCase()} className="flex items-center cursor-pointer">
      <div className="relative">
        <input 
          type="checkbox" 
          id={label.replace(/\s+/g, '-').toLowerCase()} 
          className="sr-only" 
          checked={enabled} 
          onChange={() => onChange(!enabled)} 
        />
        <div className={`block w-14 h-8 rounded-full ${enabled ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${enabled ? 'translate-x-6' : ''}`}></div>
      </div>
      <div className="ml-3 text-gray-700 font-medium">
        {label}
      </div>
    </label>
  );


  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-10 text-gray-800">Settings</h1>

      {/* User Profile Section */}
      <div className="bg-white shadow-lg rounded-xl p-8 mb-10 flex items-center gap-6 border border-gray-200">
        <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center text-4xl font-bold text-indigo-700 ring-4 ring-indigo-200">
          {getInitials()}
        </div>
        <div>
          <div className="font-semibold text-2xl text-gray-900">{getFullName()}</div>
          <div className="text-gray-600 text-md">{user?.email}</div>
          <div className="text-gray-500 text-sm mt-1 capitalize">Role: {user?.role?.toLowerCase()}</div>
        </div>
      </div>

      {/* Profile Information Form (Non-Editable) */}
      <div className="bg-white shadow-lg rounded-xl p-8 mb-10 border border-gray-200">
        <h2 className="text-xl font-semibold mb-6 text-gray-800 border-b border-gray-200 pb-3">Profile Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={getFullName()}
              disabled
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-3 bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={user?.email || ''}
              disabled
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-3 bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              User Role
            </label>
            <input
              type="text"
              id="role"
              name="role"
              value={user?.role || ''}
              disabled
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-3 bg-gray-100 text-gray-500 cursor-not-allowed capitalize focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white shadow-lg rounded-xl p-8 mb-10 border border-gray-200">
        <h2 className="text-xl font-semibold mb-6 text-gray-800 border-b border-gray-200 pb-3">Notification Settings</h2>
        <div className="space-y-6 mt-6">
          <ToggleSwitch 
            label="Email Notifications" 
            enabled={emailNotifications} 
            onChange={setEmailNotifications} 
          />
          <ToggleSwitch 
            label="SMS Notifications" 
            enabled={smsNotifications} 
            onChange={setSmsNotifications} 
          />
        </div>
      </div>

      {/* Appearance Settings */}
      <div className="bg-white shadow-lg rounded-xl p-8 mb-10 border border-gray-200">
        <h2 className="text-xl font-semibold mb-6 text-gray-800 border-b border-gray-200 pb-3">Appearance</h2>
        <div className="mt-6">
          <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-2">
            Theme
          </label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input 
                type="radio" 
                name="theme" 
                value="light" 
                checked={theme === 'light'} 
                onChange={() => setTheme('light')}
                className="form-radio h-5 w-5 text-indigo-600"
              />
              <span className="ml-2 text-gray-700">Light</span>
            </label>
            <span className="ml-4 text-sm text-gray-500 italic">
              Light mode is enforced for optimal user experience
            </span>
          </div>
        </div>
      </div>
      
      {/* Change Password Section */}
      <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-200">
        <h2 className="text-xl font-semibold mb-6 text-gray-800 border-b border-gray-200 pb-3">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-6 mt-6">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              required
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-3 bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              required
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-3 bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmNewPassword"
              name="confirmNewPassword"
              required
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-3 bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="••••••••"
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage; 