import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

interface PatientFormData {
  name: string;
  email: string;
  age?: number;
  date_of_birth?: string;
  gender?: string;
  chronic_diseases?: string;
  address?: string;
  phone_number?: string;
}

const PatientAddPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<PatientFormData>({
    name: '',
    email: '',
    age: undefined,
    date_of_birth: '',
    gender: '',
    chronic_diseases: '',
    address: '',
    phone_number: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'age' ? (value ? parseInt(value) : undefined) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("Authentication required");

      // Extract first and last name from full name
      const nameParts = formData.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Step 1: Create a user account first
      console.log('Step 1: Creating user account...');
      
      // Try the users endpoint with proper trailing slash (following RESTful convention)
      const userUrl = `${API_URL}/users/`;
      console.log(`POST ${userUrl}`);
      
      const userResponse = await fetch(userUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: 'patient123',
          first_name: firstName,
          last_name: lastName,
          role: 'PATIENT'
        })
      });

      console.log(`User creation response: ${userResponse.status}`);
      
      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error('User creation failed:', userResponse.status, errorText);
        throw new Error(`Failed to create user account (${userResponse.status}): ${errorText}`);
      }

      const userData = await userResponse.json();
      console.log('User created successfully:', userData);
      
      // Step 2: Now create the patient profile with the user_id
      console.log(`Step 2: Creating patient profile for user ID ${userData.id}...`);
      
      // Try both with and without trailing slash
      const patientUrl = `${API_URL}/patient-records/`;
      console.log(`POST ${patientUrl}`);
      
      const patientData = {
        user_id: userData.id,
        full_name: formData.name,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        chronic_diseases: formData.chronic_diseases || null,
        address: formData.address || null,
        phone_number: formData.phone_number || null,
        age: formData.age || null
      };
      
      console.log('Patient data:', patientData);
      
      const patientResponse = await fetch(patientUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData)
      });

      console.log(`Patient profile creation response: ${patientResponse.status}`);
      
      if (!patientResponse.ok) {
        // If creating the patient profile fails, try the legacy endpoint
        const errorText = await patientResponse.text();
        console.error('Patient profile creation failed:', patientResponse.status, errorText);
        
        // Try alternate endpoint mentioned in docs: "originally POST /patients/"
        console.log('Trying alternate endpoint...');
        const legacyUrl = `${API_URL}/patients/`;
        console.log(`POST ${legacyUrl}`);
        
        const legacyResponse = await fetch(legacyUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(patientData)
        });
        
        console.log(`Alternate endpoint response: ${legacyResponse.status}`);
        
        if (!legacyResponse.ok) {
          const legacyErrorText = await legacyResponse.text();
          console.error('Alternate endpoint failed:', legacyResponse.status, legacyErrorText);
          throw new Error(`Failed to create patient profile (${patientResponse.status}): ${errorText}`);
        }
        
        console.log('Patient created successfully via alternate endpoint');
      } else {
        console.log('Patient created successfully');
      }
      
      // Success - redirect to patients list
      navigate('/patients');
    } catch (err) {
      console.error('Error creating patient:', err);
      setError(err instanceof Error ? err.message : 'Failed to create patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Add New Patient</h1>
        <button
          onClick={() => navigate('/patients')}
          className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
        >
          ← Back to Patients
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                A default password "patient123" will be set for the new account.
              </p>
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Age */}
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Age
              </label>
              <input
                type="number"
                id="age"
                name="age"
                min="0"
                max="150"
                value={formData.age || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Gender */}
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address
            </label>
            <textarea
              id="address"
              name="address"
              rows={3}
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Chronic Diseases */}
          <div>
            <label htmlFor="chronic_diseases" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Chronic Diseases
            </label>
            <textarea
              id="chronic_diseases"
              name="chronic_diseases"
              rows={3}
              value={formData.chronic_diseases}
              onChange={handleChange}
              placeholder="List any chronic diseases, separated by commas"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/patients')}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                loading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Creating...' : 'Create Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientAddPage; 