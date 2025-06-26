import React from 'react';
import { useNavigate } from 'react-router-dom';

const PatientProfileErrorPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Patient Profile Not Found</h1>
        <p className="mb-6 text-gray-700">Your patient profile is not set up yet. Please contact your healthcare provider to create your profile.</p>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-4"
          onClick={() => navigate('/profile-settings')}
        >
          View Settings
        </button>
        <button
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          onClick={() => navigate('/patient-dashboard')}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default PatientProfileErrorPage;
