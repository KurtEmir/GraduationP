export interface Location {
  id: number;
  patientId: number;
  latitude: number;
  longitude: number;
  timestamp: string;
  address?: string;
  city?: string;
  country?: string;
  metadata?: Record<string, any>;
} 