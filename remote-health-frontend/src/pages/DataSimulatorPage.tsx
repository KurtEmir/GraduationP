import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface SimulatorSettings {
  isRunning: boolean;
  intervalMinutes: number;
  selectedPatients: number[];
  enableAnomalies: boolean;
  diurnalVariation: boolean;
}

const DataSimulatorPage: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SimulatorSettings>({
    isRunning: false,
    intervalMinutes: 5,
    selectedPatients: [],
    enableAnomalies: true,
    diurnalVariation: true
  });
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch available patients for simulation
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      // This would be replaced with actual API call
      const mockPatients = [
        { id: 1, full_name: 'John Doe', email: 'patient1@example.com' },
        { id: 2, full_name: 'Jane Smith', email: 'patient2@example.com' },
      ];
      setPatients(mockPatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSimulation = async () => {
    try {
      setLoading(true);
      // API call to start simulation would go here
      setSettings(prev => ({ ...prev, isRunning: true }));
    } catch (error) {
      console.error('Error starting simulation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStopSimulation = async () => {
    try {
      setLoading(true);
      // API call to stop simulation would go here
      setSettings(prev => ({ ...prev, isRunning: false }));
    } catch (error) {
      console.error('Error stopping simulation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelection = (patientId: number, selected: boolean) => {
    setSettings(prev => ({
      ...prev,
      selectedPatients: selected
        ? [...prev.selectedPatients, patientId]
        : prev.selectedPatients.filter(id => id !== patientId)
    }));
  };

  if (!user || (user.role !== 'DOCTOR' && user.role !== 'ADMIN')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only doctors and administrators can access the data simulator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Data Simulator</h1>
          <p className="mt-2 text-gray-600">
            Generate realistic vital signs data for testing and demonstration purposes.
          </p>
        </div>

        {/* Simulator Status */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Simulator Status</h2>
              <p className="text-sm text-gray-600 mt-1">
                {settings.isRunning ? 'Active - Generating data' : 'Inactive'}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleStartSimulation}
                disabled={loading || settings.isRunning}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md"
              >
                Start Simulation
              </button>
              <button
                onClick={handleStopSimulation}
                disabled={loading || !settings.isRunning}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md"
              >
                Stop Simulation
              </button>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Simulation Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Generation Interval (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={settings.intervalMinutes}
                onChange={(e) => setSettings(prev => ({ ...prev, intervalMinutes: parseInt(e.target.value) }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.enableAnomalies}
                  onChange={(e) => setSettings(prev => ({ ...prev, enableAnomalies: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Enable Anomalies</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Occasionally generate out-of-range values to test alerting
              </p>
            </div>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.diurnalVariation}
                  onChange={(e) => setSettings(prev => ({ ...prev, diurnalVariation: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Diurnal Variation</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Apply day/night cycles to vital signs
              </p>
            </div>
          </div>
        </div>

        {/* Patient Selection */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Select Patients for Simulation</h2>
          
          {loading ? (
            <div className="text-center py-4">Loading patients...</div>
          ) : (
            <div className="space-y-3">
              {patients.map((patient) => (
                <label key={patient.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.selectedPatients.includes(patient.id)}
                    onChange={(e) => handlePatientSelection(patient.id, e.target.checked)}
                    className="mr-3"
                  />
                  <div>
                    <span className="font-medium text-gray-900">{patient.full_name}</span>
                    <span className="text-gray-500 ml-2">({patient.email})</span>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataSimulatorPage;
