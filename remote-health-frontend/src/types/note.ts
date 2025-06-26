export interface Note {
  id: number;
  patientId: number;
  doctorId: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  timestamp: string;
  type: 'GENERAL' | 'PRESCRIPTION' | 'DIAGNOSIS' | 'TREATMENT';
  doctorName: string;
  metadata?: Record<string, any>;
} 