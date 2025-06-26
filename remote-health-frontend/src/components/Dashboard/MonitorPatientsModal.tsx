import React, { useEffect, useState } from 'react';
import { patientService } from '../../services/patient';
import { Patient } from '../../types/patient';
import { useAuth } from '../../contexts/AuthContext';

interface MonitorPatientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selectedPatientIds: number[]) => void;
  initiallySelectedIds: number[];
}

const MonitorPatientsModal: React.FC<MonitorPatientsModalProps> = ({ isOpen, onClose, onSave, initiallySelectedIds }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>(initiallySelectedIds);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);

      const fetchPatients =
        user?.role === 'DOCTOR'
          ? patientService.getDoctorPatients
          : patientService.getAllPatients;

      fetchPatients()
        .then((data: Patient[]) => {
          setPatients(data);
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to load patients. Please try again.');
          setLoading(false);
        });
    }
  }, [isOpen, user]);

  useEffect(() => {
    setSelectedIds(initiallySelectedIds);
  }, [initiallySelectedIds]);

  const handleToggle = (patientId: number) => {
    setSelectedIds(prev =>
      prev.includes(patientId) ? prev.filter(id => id !== patientId) : [...prev, patientId]
    );
  };

  const handleSave = () => {
    onSave(selectedIds);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Select Patients to Monitor</h2>
        </div>
        <div className="p-4 max-h-96 overflow-y-auto">
          {loading ? <p>Loading...</p> : error ? <p className="text-red-500">{error}</p> : (
            <ul className="space-y-2">
              {patients.map(patient => (
                <li key={patient.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`patient-${patient.id}`}
                    checked={selectedIds.includes(typeof patient.id === 'string' ? parseInt(patient.id, 10) : patient.id)}
                    onChange={() => handleToggle(typeof patient.id === 'string' ? parseInt(patient.id, 10) : patient.id)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor={`patient-${patient.id}`} className="ml-3 block text-sm font-medium text-gray-700">
                    {patient.full_name}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-4 border-t flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Save</button>
        </div>
      </div>
    </div>
  );
};

export default MonitorPatientsModal; 