export interface Alert {
    id: number;
    patientId: number;
    type: 'CRITICAL' | 'WARNING' | 'MILD';
    message: string;
    timestamp: string;
    status: 'ACTIVE' | 'RESOLVED';
    metadata?: Record<string, any>;
} 