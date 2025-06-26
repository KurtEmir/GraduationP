import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { patientService } from '../services/patient';
import { Patient } from '../types/patient';

const PatientListPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await patientService.getAllPatients();
        setPatients(data);
      } catch (err) {
        setError('Failed to fetch patients');
        console.error('Error fetching patients:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const handleDelete = async (patientId: number) => {
    if (window.confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
      try {
        await patientService.deletePatient(patientId);
        setPatients(prevPatients => prevPatients.filter(p => p.id !== patientId));
      } catch (err) {
        setError('Failed to delete patient. Please try again.');
        console.error('Error deleting patient:', err);
      }
    }
  };

  const filteredPatients = patients.filter(patient =>
    (patient.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patient.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-gray-300">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-2 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Patients</h1>
        <Link
          to="/patients/new"
          className="bg-indigo-600 text-white px-6 py-2 rounded-md shadow hover:bg-indigo-700 transition-colors font-semibold flex items-center gap-2"
        >
          <span className="text-xl">+</span> Add New Patient
        </Link>
      </div>
      {/* Search Bar */}
      <div className="max-w-xl mb-8">
        <div className="relative">
          <input
            type="text"
            placeholder="Search patients by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              className="h-5 w-5 text-gray-400 dark:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>
      {/* Patient Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map(patient => (
          <div
            key={patient.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-6 flex flex-col gap-4 border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xl font-bold text-indigo-600 dark:text-indigo-300">
                {(patient.name || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{patient.name || 'N/A'}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{patient.email || 'N/A'}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Last Updated</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                  {patient.updatedAt ? new Date(patient.updatedAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium 
                ${(patient.status || 'unknown').toLowerCase() === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'}
              `}>
                {((patient.status || 'unknown').charAt(0).toUpperCase() + (patient.status || 'unknown').slice(1).toLowerCase())}
              </span>
            </div>
            {/* Action Buttons */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <Link
                to={`/patient/${patient.id}/details`}
                className="text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md shadow-sm font-medium transition-colors"
              >
                View Details
              </Link>
              <Link
                to={`/messaging?partnerId=${patient.user_id}`}
                className="text-sm bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md shadow-sm font-medium transition-colors flex items-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-6zm-2-1.6V6c0-.55-.45-1-1-1H5c-.55 0-1 .45-1 1v2.4L10 11l6-2.6zM4 16v-5.17L9.3 13H10l.7-.17L16 10.83V16H4z" clipRule="evenodd" />
                </svg>
                Message
              </Link>
              <button
                onClick={() => handleDelete(typeof patient.id === 'string' ? parseInt(patient.id, 10) : patient.id)}
                className="text-sm bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md shadow-sm font-medium transition-colors flex items-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {filteredPatients.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No patients found</p>
        </div>
      )}
    </div>
  );
};

export default PatientListPage; 