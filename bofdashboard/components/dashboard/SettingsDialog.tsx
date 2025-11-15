'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings } from 'lucide-react';
import { DashboardSettings, KPIMetric } from '@/types';

interface SettingsDialogProps {
  settings: DashboardSettings;
  metrics: KPIMetric[];
  onUpdateSettings: (settings: Partial<DashboardSettings>) => void;
  onUpdateThresholds: (metricId: string, warning: number, danger: number) => void;
}

export function SettingsDialog({
  settings,
  metrics,
  onUpdateSettings,
  onUpdateThresholds,
}: SettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);
  const [selectedMetric, setSelectedMetric] = useState<string>(metrics[0]?.id || '');
  const [thresholds, setThresholds] = useState<Record<string, { warning: number; danger: number }>>(
    metrics.reduce((acc, metric) => {
      acc[metric.id] = {
        warning: metric.warningThreshold,
        danger: metric.dangerThreshold,
      };
      return acc;
    }, {} as Record<string, { warning: number; danger: number }>)
  );

  const handleSave = () => {
    onUpdateSettings(localSettings);
    Object.entries(thresholds).forEach(([metricId, { warning, danger }]) => {
      onUpdateThresholds(metricId, warning, danger);
    });
    setOpen(false);
  };

  const handleRefreshIntervalChange = (value: number[]) => {
    setLocalSettings({ ...localSettings, refreshInterval: value[0] });
  };

  const selectedMetricData = metrics.find(m => m.id === selectedMetric);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dashboard Settings</DialogTitle>
          <DialogDescription>
            Configure dashboard refresh rate, display options, and KPI thresholds
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="refresh-interval">
              Refresh Interval: {localSettings.refreshInterval / 1000}s
            </Label>
            <Slider
              id="refresh-interval"
              min={1000}
              max={10000}
              step={1000}
              value={[localSettings.refreshInterval]}
              onValueChange={handleRefreshIntervalChange}
            />
            <p className="text-xs text-muted-foreground">
              How often the dashboard updates (1-10 seconds)
            </p>
          </div>

          <div className="space-y-4">
            <Label>Display Options</Label>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-gauges" className="font-normal">
                Show Gauge Charts
              </Label>
              <Switch
                id="show-gauges"
                checked={localSettings.showGauges}
                onCheckedChange={(checked) =>
                  setLocalSettings({ ...localSettings, showGauges: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-trends" className="font-normal">
                Show Trend Charts
              </Label>
              <Switch
                id="show-trends"
                checked={localSettings.showTrends}
                onCheckedChange={(checked) =>
                  setLocalSettings({ ...localSettings, showTrends: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-alerts" className="font-normal">
                Show Alert Panel
              </Label>
              <Switch
                id="show-alerts"
                checked={localSettings.showAlerts}
                onCheckedChange={(checked) =>
                  setLocalSettings({ ...localSettings, showAlerts: checked })
                }
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Threshold Configuration</Label>
            <div className="space-y-2">
              <Label htmlFor="metric-select">Select KPI</Label>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger id="metric-select">
                  <SelectValue placeholder="Select a metric" />
                </SelectTrigger>
                <SelectContent>
                  {metrics.map((metric) => (
                    <SelectItem key={metric.id} value={metric.id}>
                      {metric.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedMetricData && (
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="warning-threshold">
                    Warning Threshold ({selectedMetricData.unit})
                  </Label>
                  <Input
                    id="warning-threshold"
                    type="number"
                    min={selectedMetricData.min}
                    max={selectedMetricData.max}
                    step="0.1"
                    value={thresholds[selectedMetric]?.warning || selectedMetricData.warningThreshold}
                    onChange={(e) =>
                      setThresholds({
                        ...thresholds,
                        [selectedMetric]: {
                          ...thresholds[selectedMetric],
                          warning: parseFloat(e.target.value),
                        },
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Range: {selectedMetricData.min} - {selectedMetricData.max}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="danger-threshold">
                    Critical Threshold ({selectedMetricData.unit})
                  </Label>
                  <Input
                    id="danger-threshold"
                    type="number"
                    min={selectedMetricData.min}
                    max={selectedMetricData.max}
                    step="0.1"
                    value={thresholds[selectedMetric]?.danger || selectedMetricData.dangerThreshold}
                    onChange={(e) =>
                      setThresholds({
                        ...thresholds,
                        [selectedMetric]: {
                          ...thresholds[selectedMetric],
                          danger: parseFloat(e.target.value),
                        },
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be greater than warning threshold
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
