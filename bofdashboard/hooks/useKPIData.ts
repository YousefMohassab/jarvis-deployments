'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { KPIMetric, Alert, DashboardSettings } from '@/types';
import { generateInitialMetrics, updateMetricValue, generateAlertFromMetric } from '@/lib/data-generator';

const DEFAULT_SETTINGS: DashboardSettings = {
  refreshInterval: 2000,
  theme: 'system',
  showGauges: true,
  showTrends: true,
  showAlerts: true,
};

export function useKPIData() {
  const [metrics, setMetrics] = useState<KPIMetric[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [settings, setSettings] = useState<DashboardSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateMetrics = useCallback(() => {
    setMetrics((prevMetrics) => {
      const updatedMetrics = prevMetrics.map((metric) => {
        const previousStatus = metric.status;
        const updatedMetric = updateMetricValue(metric);

        const alert = generateAlertFromMetric(updatedMetric, previousStatus);
        if (alert) {
          setAlerts((prevAlerts) => [alert, ...prevAlerts].slice(0, 50));
        }

        return updatedMetric;
      });

      return updatedMetrics;
    });
  }, []);

  useEffect(() => {
    const initialMetrics = generateInitialMetrics();
    setMetrics(initialMetrics);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      updateMetrics();
    }, settings.refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [settings.refreshInterval, updateMetrics]);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts((prevAlerts) =>
      prevAlerts.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.id !== alertId));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<DashboardSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const updateThresholds = useCallback((metricId: string, warningThreshold: number, dangerThreshold: number) => {
    setMetrics((prevMetrics) =>
      prevMetrics.map((metric) =>
        metric.id === metricId
          ? { ...metric, warningThreshold, dangerThreshold }
          : metric
      )
    );
  }, []);

  return {
    metrics,
    alerts,
    settings,
    isLoading,
    acknowledgeAlert,
    dismissAlert,
    updateSettings,
    updateThresholds,
  };
}
