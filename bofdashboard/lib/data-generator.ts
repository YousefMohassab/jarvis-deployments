import { KPIMetric, HistoryPoint, Alert } from '@/types';

const KPI_CONFIGS = {
  temperature: {
    id: 'temperature',
    name: 'Bath Temperature',
    unit: '°C',
    min: 1600,
    max: 1700,
    warningThreshold: 1680,
    dangerThreshold: 1690,
    baseValue: 1650,
    variance: 30,
  },
  pressure: {
    id: 'pressure',
    name: 'Lance Pressure',
    unit: 'bar',
    min: 8.5,
    max: 15.0,
    warningThreshold: 13.5,
    dangerThreshold: 14.5,
    baseValue: 11.5,
    variance: 2,
  },
  oxygen: {
    id: 'oxygen',
    name: 'O₂ Flow Rate',
    unit: 'Nm³/h',
    min: 600,
    max: 1200,
    warningThreshold: 1100,
    dangerThreshold: 1180,
    baseValue: 900,
    variance: 150,
  },
};

function determineStatus(
  value: number,
  warningThreshold: number,
  dangerThreshold: number
): 'normal' | 'warning' | 'critical' {
  if (value >= dangerThreshold) return 'critical';
  if (value >= warningThreshold) return 'warning';
  return 'normal';
}

function generateValue(config: typeof KPI_CONFIGS[keyof typeof KPI_CONFIGS]): number {
  const randomVariance = (Math.random() - 0.5) * config.variance;
  const value = config.baseValue + randomVariance;
  return Math.max(config.min, Math.min(config.max, value));
}

export function generateInitialMetrics(): KPIMetric[] {
  const timestamp = new Date();

  return Object.values(KPI_CONFIGS).map((config) => {
    const history: HistoryPoint[] = [];

    for (let i = 19; i >= 0; i--) {
      const histTimestamp = new Date(timestamp.getTime() - i * 2000);
      const value = generateValue(config);
      const status = determineStatus(value, config.warningThreshold, config.dangerThreshold);

      history.push({ timestamp: histTimestamp, value, status });
    }

    const currentValue = history[history.length - 1].value;
    const status = determineStatus(currentValue, config.warningThreshold, config.dangerThreshold);

    return {
      id: config.id,
      name: config.name,
      value: currentValue,
      unit: config.unit,
      min: config.min,
      max: config.max,
      warningThreshold: config.warningThreshold,
      dangerThreshold: config.dangerThreshold,
      status,
      timestamp,
      history,
    };
  });
}

export function updateMetricValue(metric: KPIMetric): KPIMetric {
  const config = KPI_CONFIGS[metric.id as keyof typeof KPI_CONFIGS];
  const newValue = generateValue(config);
  const newStatus = determineStatus(newValue, metric.warningThreshold, metric.dangerThreshold);
  const timestamp = new Date();

  const newHistory = [
    ...metric.history.slice(1),
    { timestamp, value: newValue, status: newStatus },
  ];

  return {
    ...metric,
    value: newValue,
    status: newStatus,
    timestamp,
    history: newHistory,
  };
}

export function generateAlertFromMetric(metric: KPIMetric, previousStatus: 'normal' | 'warning' | 'critical'): Alert | null {
  if (metric.status === previousStatus || metric.status === 'normal') {
    return null;
  }

  let message = '';
  let severity: Alert['severity'] = 'info';

  if (metric.status === 'critical') {
    message = `${metric.name} has reached CRITICAL level: ${metric.value.toFixed(1)}${metric.unit}`;
    severity = 'critical';
  } else if (metric.status === 'warning') {
    message = `${metric.name} has exceeded WARNING threshold: ${metric.value.toFixed(1)}${metric.unit}`;
    severity = 'warning';
  }

  return {
    id: `alert-${Date.now()}-${metric.id}`,
    severity,
    message,
    timestamp: new Date(),
    kpiId: metric.id,
    acknowledged: false,
  };
}
