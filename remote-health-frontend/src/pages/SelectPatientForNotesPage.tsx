import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { patientService } from '../services/patient';
import { Patient } from '../types/patient';

const SelectPatientForNotesPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await patientService.getAllPatients();
        setPatients(data);
      } catch (err) {
        setError('Failed to fetch patients');
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  if (loading) return <div className="p-6 text-center">Loading patients...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Select a Patient</h1>
      <div className="bg-white shadow-lg rounded-lg">
        <ul className="divide-y divide-gray-200">
          {patients.map(patient => (
            <li key={patient.id}>
              <Link to={`/notes/${patient.id}`} className="block p-4 hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                    {(patient.full_name || '?').charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-indigo-600 truncate">{patient.full_name}</p>
                    <p className="text-sm text-gray-500 truncate">{patient.email}</p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SelectPatientForNotesPage; 