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

  const getInitials = (name: string | undefined | null): string => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const filteredPatients = patients.filter(patient =>
    (patient.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      </div>
      
      {/* Patient Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPatients.map(patient => (
          <div
            key={patient.user_id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 p-6 flex flex-col justify-between border border-gray-200/80"
          >
            <div className="flex-grow">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-14 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xl font-bold text-indigo-600 dark:text-indigo-300">
                  {getInitials(patient.full_name)}
              </div>
              <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate" title={patient.full_name || ''}>
                    {patient.full_name || 'N/A'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate" title={patient.email || ''}>
                    {patient.email || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Status</span>
                      <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${
                          (patient.status || 'unknown').toLowerCase() === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' 
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
                      }`}>
                          {patient.status ? patient.status.charAt(0).toUpperCase() + patient.status.slice(1) : 'Unknown'}
                      </span>
            </div>
                  <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Last Updated</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                  {patient.updatedAt ? new Date(patient.updatedAt).toLocaleDateString() : 'N/A'}
                      </span>
                  </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center gap-2">
              <Link
                to={`/patients/${patient.user_id}`}
                className="flex-1 text-center text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-2 rounded-md shadow-sm font-medium transition-colors"
              >
                View Details
              </Link>
              <Link
                to={`/messaging?partnerId=${patient.user_id}`}
                className="flex-1 text-center text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-2 rounded-md shadow-sm font-medium transition-colors flex items-center justify-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-6zm-2-1.6V6c0-.55-.45-1-1-1H5c-.55 0-1 .45-1 1v2.4L10 11l6-2.6zM4 16v-5.17L9.3 13H10l.7-.17L16 10.83V16H4z" clipRule="evenodd" />
                </svg>
                <span className="truncate">Message</span>
              </Link>
              <button
                onClick={() => handleDelete(patient.user_id)}
                className="flex-1 text-center text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-2 rounded-md shadow-sm font-medium transition-colors flex items-center justify-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                </svg>
                <span className="truncate">Delete</span>
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