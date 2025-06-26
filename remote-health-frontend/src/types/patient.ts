export interface Patient {
    id: string | number;
    user_id: number;
    name?: string; // Optional for backward compatibility
    full_name?: string; // What backend actually returns
    email: string;
    role: 'PATIENT';
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
    updatedAt: string;
    metadata?: Record<string, any>;
    age?: number;
    date_of_birth?: string;
    gender?: string;
    chronic_diseases?: string;
    address?: string;
    phone_number?: string;
}

export interface VitalSigns {
    heartRate?: number;
    systolic?: number;
    diastolic?: number;
    pulse?: number;
    temperature?: number;
    oxygenSaturation?: number;
    respiratoryRate?: number;
    timestamp?: string;
} 