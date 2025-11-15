'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { KPIMetric } from '@/types';
import { formatTimestamp } from '@/lib/utils';

interface TrendChartProps {
  metric: KPIMetric;
}

export function TrendChart({ metric }: TrendChartProps) {
  const chartData = metric.history.map((point) => ({
    time: formatTimestamp(point.timestamp),
    value: point.value,
    status: point.status,
  }));

  const getStrokeColor = (status: string) => {
    switch (status) {
      case 'critical':
        return '#ef4444';
      case 'warning':
        return '#eab308';
      default:
        return '#22c55e';
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold">{payload[0].payload.time}</p>
          <p className="text-sm">
            Value: <span className="font-bold">{payload[0].value.toFixed(1)}</span> {metric.unit}
          </p>
          <p className="text-xs text-muted-foreground capitalize">
            Status: {payload[0].payload.status}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{metric.name} Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
              tickFormatter={(value, index) => (index % 5 === 0 ? value : '')}
            />
            <YAxis
              domain={[metric.min, metric.max]}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.toFixed(0)}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={metric.warningThreshold}
              stroke="#eab308"
              strokeDasharray="5 5"
              label={{ value: 'Warning', position: 'right', fontSize: 10 }}
            />
            <ReferenceLine
              y={metric.dangerThreshold}
              stroke="#ef4444"
              strokeDasharray="5 5"
              label={{ value: 'Critical', position: 'right', fontSize: 10 }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={getStrokeColor(metric.status)}
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
