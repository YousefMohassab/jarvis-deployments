'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KPIMetric } from '@/types';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface KPICardProps {
  metric: KPIMetric;
}

export function KPICard({ metric }: KPICardProps) {
  const getStatusColor = () => {
    switch (metric.status) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getTrend = () => {
    if (metric.history.length < 2) return 'stable';
    const current = metric.value;
    const previous = metric.history[metric.history.length - 2].value;
    const diff = current - previous;

    if (Math.abs(diff) < 0.5) return 'stable';
    return diff > 0 ? 'up' : 'down';
  };

  const getTrendIcon = () => {
    const trend = getTrend();
    switch (trend) {
      case 'up':
        return <ArrowUp className="h-4 w-4" />;
      case 'down':
        return <ArrowDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getPercentage = () => {
    return ((metric.value - metric.min) / (metric.max - metric.min) * 100).toFixed(0);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {metric.name}
          </CardTitle>
          <Badge variant={getStatusColor()} className="text-xs">
            {metric.status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-3xl font-bold">
              {metric.value.toFixed(1)}
              <span className="text-lg text-muted-foreground ml-1">{metric.unit}</span>
            </div>
            <div className="flex items-center mt-1 text-sm text-muted-foreground">
              {getTrendIcon()}
              <span className="ml-1">{getPercentage()}% of range</span>
            </div>
          </div>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          Range: {metric.min} - {metric.max} {metric.unit}
        </div>
      </CardContent>
    </Card>
  );
}
