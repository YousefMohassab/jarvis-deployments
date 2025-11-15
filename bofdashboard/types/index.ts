export interface KPIMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  warningThreshold: number;
  dangerThreshold: number;
  status: 'normal' | 'warning' | 'critical';
  timestamp: Date;
  history: HistoryPoint[];
}

export interface HistoryPoint {
  timestamp: Date;
  value: number;
  status: 'normal' | 'warning' | 'critical';
}

export interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  kpiId: string;
  acknowledged: boolean;
}

export interface DashboardSettings {
  refreshInterval: number;
  theme: 'light' | 'dark' | 'system';
  showGauges: boolean;
  showTrends: boolean;
  showAlerts: boolean;
}

export interface ThresholdConfig {
  warningThreshold: number;
  dangerThreshold: number;
}
