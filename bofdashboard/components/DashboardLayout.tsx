'use client';

import React from 'react';
import { useKPIData } from '@/hooks/useKPIData';
import { GaugeChart } from '@/components/dashboard/GaugeChart';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { KPICard } from '@/components/dashboard/KPICard';
import { AlertPanel } from '@/components/dashboard/AlertPanel';
import { SettingsDialog } from '@/components/dashboard/SettingsDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, BarChart3, Gauge } from 'lucide-react';

export function DashboardLayout() {
  const {
    metrics,
    alerts,
    settings,
    isLoading,
    acknowledgeAlert,
    dismissAlert,
    updateSettings,
    updateThresholds,
  } = useKPIData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <Activity className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">BOF KPI Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Basic Oxygen Furnace Monitoring System
                </p>
              </div>
            </div>
            <SettingsDialog
              settings={settings}
              metrics={metrics}
              onUpdateSettings={updateSettings}
              onUpdateThresholds={updateThresholds}
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="gauges" className="gap-2">
              <Gauge className="h-4 w-4" />
              Gauges
            </TabsTrigger>
            <TabsTrigger value="trends" className="gap-2">
              <Activity className="h-4 w-4" />
              Trends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {metrics.map((metric) => (
                <KPICard key={metric.id} metric={metric} />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Real-time Monitoring</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {settings.showGauges && (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {metrics.map((metric) => (
                          <GaugeChart key={metric.id} metric={metric} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {settings.showAlerts && (
                <div>
                  <AlertPanel
                    alerts={alerts}
                    onAcknowledge={acknowledgeAlert}
                    onDismiss={dismissAlert}
                  />
                </div>
              )}
            </div>

            {settings.showTrends && (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {metrics.map((metric) => (
                  <TrendChart key={metric.id} metric={metric} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="gauges" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {metrics.map((metric) => (
                <GaugeChart key={metric.id} metric={metric} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {metrics.map((metric) => (
                <TrendChart key={metric.id} metric={metric} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t bg-card mt-12">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>BOF KPI Dashboard v1.0.0</p>
            <p>
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
