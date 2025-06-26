export interface DiseaseThreshold {
  id: number;
  disease: string;
  heart_rate_min: number;
  heart_rate_max: number;
  temperature_min: number;
  temperature_max: number;
  spo2_min: number;
  spo2_max: number;
  systolic_bp_min: number;
  systolic_bp_max: number;
  diastolic_bp_min: number;
  diastolic_bp_max: number;
}

export type ThresholdMetric = 'heart_rate' | 'temperature' | 'spo2' | 'systolic_bp' | 'diastolic_bp'; 