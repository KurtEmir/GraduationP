import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { patientService } from '../services/patient';
import { Patient } from '../types/patient';

// Define a type for the form data, aligning with Patient profile fields
interface ProfileFormData {
  name: string; // Will be used as fullName
  email: string; // Display only, not editable by patient usually
  age?: string; // Stored as string in form, converted to number on submit
  date_of_birth?: string;
  gender?: string;
  chronic_diseases?: string;
  address?: string;
  phone_number?: string;
  // Add other fields as necessary based on your Patient type
}

const ProfileSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // To get user.id if needed for a create operation
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    email: '',
    age: '',
    date_of_birth: '',
    gender: '',
    chronic_diseases: '',
    address: '',
    phone_number: '',
  });
  const [initialProfile, setInitialProfile] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      // Only fetch profile for PATIENT users
      if (user?.role !== 'PATIENT') {
        setIsLoading(false);
        setError('Profile settings are only available for patient accounts.');
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const profile = await patientService.getCurrentPatientProfile();
        if (profile) {
          setInitialProfile(profile);
          setFormData({
            name: profile.name || '',
            email: profile.email || '', // Usually fetched from user context or non-editable
            age: profile.age?.toString() || '',
            date_of_birth: profile.date_of_birth || '',
            gender: profile.gender || '',
            chronic_diseases: profile.chronic_diseases || '',
            address: profile.address || '',
            phone_number: profile.phone_number || '',
          });
        } else {
          // No existing profile, but user is authenticated (PATIENT role)
          // Pre-fill email from auth context if available and no profile exists
          if(user && !profile) {
            setFormData(prev => ({...prev, email: user.email, name: `${user.firstName || ''} ${user.lastName || ''}`.trim() }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setError(err instanceof Error ? err.message : 'Could not load your profile. Please try again.');
      }
      setIsLoading(false);
    };

    if (user) { // Ensure user is loaded from AuthContext first
        fetchProfile();
    } else {
        setIsLoading(false); // Stop loading if no user (should be caught by AuthGuard)
    }
  }, [user]); // Depend on user from AuthContext

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!user?.id) {
      setError("User not authenticated.");
      setIsLoading(false);
      return;
    }

    const ageValue = formData.age ? parseInt(formData.age, 10) : undefined;
    if (formData.age && (isNaN(ageValue!) || ageValue! < 0)) {
        setError("Age must be a valid positive number.");
        setIsLoading(false);
        return;
    }

    console.log("Demo Mode: Profile Data to be submitted:", {
      name: formData.name,
      age: ageValue,
      date_of_birth: formData.date_of_birth || undefined,
      gender: formData.gender || undefined,
      chronic_diseases: formData.chronic_diseases || undefined,
      address: formData.address || undefined,
      phone_number: formData.phone_number || undefined,
    });

    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage('Profile updated successfully! (Demo Mode)');
      
      setInitialProfile(prev => ({ 
        ...(prev || {} as Patient), 
        id: prev?.id || user.id, 
        name: formData.name,
        email: formData.email,
        age: ageValue,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        chronic_diseases: formData.chronic_diseases,
        address: formData.address,
        phone_number: formData.phone_number,
        role: 'PATIENT', 
        status: prev?.status || 'ACTIVE',
        createdAt: prev?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      setTimeout(() => {
        localStorage.setItem('profileDemoCompleted', 'true');
        console.log('ProfileSettingsPage: localStorage profileDemoCompleted SET to true');
        
        setTimeout(() => {
            navigate('/'); // Redirect to dashboard
        }, 50); // 50ms delay, can be adjusted

      }, 1500); // Delay before setting flag and navigating (was 1500)
    }, 1000); // Initial delay to simulate API call (was 1000)
  };

  if (isLoading && !initialProfile) { // Show main loading only on initial fetch
    return <div className="flex justify-center items-center h-screen">Loading profile...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>
      
      {error && <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">{error}</div>}
      {successMessage && <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">{successMessage}</div>}

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4">
        {/* Name */}
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">Full Name</label>
          <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
        </div>

        {/* Email (Read-only) */}
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email</label>
          <input type="email" name="email" id="email" value={formData.email} readOnly className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100" />
        </div>
        
        {/* Date of Birth */}
        <div className="mb-4">
          <label htmlFor="date_of_birth" className="block text-gray-700 text-sm font-bold mb-2">Date of Birth</label>
          <input type="date" name="date_of_birth" id="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
        </div>

        {/* Age (Optional, could be calculated from DOB or entered directly) */}
        <div className="mb-4">
          <label htmlFor="age" className="block text-gray-700 text-sm font-bold mb-2">Age (Optional)</label>
          <input type="number" name="age" id="age" value={formData.age} onChange={handleChange} min="0" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
        </div>

        {/* Gender */}
        <div className="mb-4">
          <label htmlFor="gender" className="block text-gray-700 text-sm font-bold mb-2">Gender</label>
          <select name="gender" id="gender" value={formData.gender} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>

        {/* Chronic Diseases */}
        <div className="mb-6">
          <label htmlFor="chronic_diseases" className="block text-gray-700 text-sm font-bold mb-2">Chronic Diseases (comma separated)</label>
          <textarea name="chronic_diseases" id="chronic_diseases" value={formData.chronic_diseases} onChange={handleChange} rows={3} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
        </div>
        
        {/* Phone Number */}
        <div className="mb-4">
          <label htmlFor="phone_number" className="block text-gray-700 text-sm font-bold mb-2">Phone Number</label>
          <input type="tel" name="phone_number" id="phone_number" value={formData.phone_number} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
        </div>

        {/* Address */}
        <div className="mb-6">
          <label htmlFor="address" className="block text-gray-700 text-sm font-bold mb-2">Address</label>
          <textarea name="address" id="address" value={formData.address} onChange={handleChange} rows={3} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
        </div>

        <div className="flex items-center justify-between">
          <button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50">
            {isLoading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettingsPage; 