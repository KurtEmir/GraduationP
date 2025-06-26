import React from 'react';

const AdminDashboardPage: React.FC = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
      <div className="bg-white shadow-md rounded-lg p-6">
        <p className="text-gray-700">Welcome to the Admin Dashboard.</p>
        <p className="mt-4 text-sm text-gray-500">
          This area will contain administrative tools, user management, system statistics, etc.
        </p>
        {/* TODO: Implement admin-specific components and data views */}
      </div>
    </div>
  );
};

export default AdminDashboardPage; 