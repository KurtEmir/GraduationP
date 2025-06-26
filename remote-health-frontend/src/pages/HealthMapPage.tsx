import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { patientService } from '../services/patient';
import { locationService } from '../services/location';
import { alertService } from '../services/alert';
import { Patient } from '../types/patient';
import { Location } from '../types/location';
import { Alert } from '../types/alert';

// Note: You'll need to install and configure a mapping library like Leaflet or Google Maps
// This is a placeholder implementation using a simple grid-based visualization

const HealthMapPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsData, locationsData, alertsData] = await Promise.all([
          patientService.getAllPatients(),
          locationService.getAllLocations(),
          alertService.getAllAlerts()
        ]);
        setPatients(patientsData);
        setLocations(locationsData);
        setAlerts(alertsData);
      } catch (err) {
        setError('Failed to fetch data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getPatientLocation = (patientId: string | number) => {
    if (typeof patientId === 'string') return undefined;
    return locations.find(loc => loc.patientId === patientId);
  };

  const getPatientAlerts = (patientId: string | number): Alert[] => {
    if (typeof patientId === 'string') return [];
    return alerts.filter(alert => alert.patientId === patientId);
  };

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'CRITICAL':
        return 'bg-red-500';
      case 'WARNING':
        return 'bg-yellow-500';
      case 'MILD':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex max-w-7xl mx-auto py-8 px-2 md:px-0">
      {/* Map Area */}
      <div className="flex-1 bg-gray-100 p-4 rounded-l-lg shadow">
        <div className="bg-white rounded-lg shadow h-full p-4 flex flex-col">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Health Map</h1>
          {/* Placeholder for actual map implementation */}
          <div className="grid grid-cols-10 gap-2 h-[calc(100%-4rem)]">
            {patients.length > 0 && Array.from({ length: 100 }).map((_, index) => {
              const patient = patients[index % patients.length];
              const patientAlerts = getPatientAlerts(patient.id);
              const hasCriticalAlert = patientAlerts.some(alert => alert.type === 'CRITICAL');
              return (
                <div
                  key={index}
                  className={`relative rounded-lg cursor-pointer flex items-center justify-center h-10 w-10 ${
                    hasCriticalAlert ? 'bg-red-100' : 'bg-green-100'
                  } border border-gray-200 shadow`}
                  onClick={() => setSelectedPatient(patient)}
                >
                  <span className="text-xs font-medium text-gray-700">
                    {patient.name?.charAt(0)}
                  </span>
                </div>
              );
            })}
            {patients.length === 0 && (
              <div className="col-span-10 text-center text-gray-500 pt-10">
                No patient data available to display on the map.
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Patient Details Sidebar */}
      <div className="w-96 bg-white border-l border-gray-200 p-6 overflow-y-auto rounded-r-lg shadow flex flex-col">
        {selectedPatient ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedPatient.name}
              </h2>
              <p className="text-gray-500">{selectedPatient.email}</p>
            </div>
            {/* Location */}
            <div>
              <h3 className="text-sm font-medium text-gray-700">Location</h3>
              <p className="mt-1 text-sm text-gray-900">
                {(() => {
                  const loc = getPatientLocation(selectedPatient.id);
                  if (!loc) return 'No location data';
                  return `Lat: ${loc.latitude}, Lng: ${loc.longitude}`;
                })()}
              </p>
            </div>
            {/* Recent Alerts */}
            <div>
              <h3 className="text-sm font-medium text-gray-700">Recent Alerts</h3>
              <div className="mt-2 space-y-2">
                {getPatientAlerts(selectedPatient.id).map(alert => (
                  <div
                    key={alert.id}
                    className={`p-2 rounded ${getAlertColor(alert.type)} text-white text-sm`}
                  >
                    {alert.message}
                  </div>
                ))}
              </div>
            </div>
            {/* Actions */}
            <div className="flex space-x-4">
              <Link
                to={`/patients/${selectedPatient.id}`}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-center shadow"
              >
                View Details
              </Link>
              <Link
                to={`/messaging?patient=${selectedPatient.id}`}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-center shadow"
              >
                Send Message
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Select a patient to view details
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthMapPage; 