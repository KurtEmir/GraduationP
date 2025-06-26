import React, { useState, useEffect } from 'react';
import { patientService } from '../services/patient';
import { useAuth } from '../contexts/AuthContext';
import { VitalSigns } from '../types/patient';

const DataEntryPage: React.FC = () => {
  const { user } = useAuth();
  const [vitals, setVitals] = useState<VitalSigns>({
    heartRate: 0,
    systolic: 0,
    diastolic: 0,
    pulse: 0,
    temperature: 0,
    oxygenSaturation: 0,
    respiratoryRate: 0
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setVitals(prev => ({
      ...prev,
      [name]: value === '' ? undefined : Number(value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    if (!user || !user.id || user.role !== 'PATIENT') {
      setError('Only patient accounts can add vital signs.');
      setLoading(false);
      return;
    }

    try {
      await patientService.addVitalSigns(user.id, vitals);
      setSuccess(true);
      setVitals({
        heartRate: 0,
        systolic: 0,
        diastolic: 0,
        pulse: 0,
        temperature: 0,
        oxygenSaturation: 0,
        respiratoryRate: 0
      });
    } catch (err) {
      setError('Failed to save vital signs');
      console.error('Error saving vital signs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Enter Vital Signs</h1>
      <p className="text-gray-500 mb-8">Please fill in your latest health data below. All fields are required.</p>
      <div className="bg-white shadow rounded-lg p-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">
            Vital signs submitted successfully!
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Heart Rate */}
            <div>
              <label htmlFor="heartRate" className="block text-sm font-medium text-gray-700 mb-1">
                Heart Rate (bpm)
              </label>
              <input
                type="number"
                id="heartRate"
                name="heartRate"
                value={vitals.heartRate}
                onChange={handleChange}
                required
                min="0"
                max="250"
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            {/* Temperature */}
            <div>
              <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 mb-1">
                Temperature (°C)
              </label>
              <input
                type="number"
                id="temperature"
                name="temperature"
                value={vitals.temperature}
                onChange={handleChange}
                required
                min="35"
                max="42"
                step="0.1"
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            {/* SpO2 */}
            <div>
              <label htmlFor="spo2" className="block text-sm font-medium text-gray-700 mb-1">
                SpO2 (%)
              </label>
              <input
                type="number"
                id="spo2"
                name="oxygenSaturation"
                value={vitals.oxygenSaturation}
                onChange={handleChange}
                required
                min="0"
                max="100"
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            {/* Respiratory Rate */}
            <div>
              <label htmlFor="respiratoryRate" className="block text-sm font-medium text-gray-700 mb-1">
                Respiratory Rate (breaths/min)
              </label>
              <input
                type="number"
                id="respiratoryRate"
                name="respiratoryRate"
                value={vitals.respiratoryRate}
                onChange={handleChange}
                required
                min="0"
                max="60"
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            {/* Blood Pressure Systolic */}
            <div>
              <label htmlFor="systolic" className="block text-sm font-medium text-gray-700 mb-1">
                Systolic Blood Pressure (mmHg)
              </label>
              <input
                type="number"
                id="systolic"
                name="systolic"
                value={vitals.systolic ?? ''}
                onChange={handleChange}
                required
                min="60"
                max="250"
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            {/* Blood Pressure Diastolic */}
            <div>
              <label htmlFor="diastolic" className="block text-sm font-medium text-gray-700 mb-1">
                Diastolic Blood Pressure (mmHg)
              </label>
              <input
                type="number"
                id="diastolic"
                name="diastolic"
                value={vitals.diastolic ?? ''}
                onChange={handleChange}
                required
                min="40"
                max="150"
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Vital Signs'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DataEntryPage; 