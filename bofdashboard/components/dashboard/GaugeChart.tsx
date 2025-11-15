'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KPIMetric } from '@/types';

interface GaugeChartProps {
  metric: KPIMetric;
}

export function GaugeChart({ metric }: GaugeChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animatedValue, setAnimatedValue] = useState(metric.value);

  useEffect(() => {
    const animate = () => {
      setAnimatedValue((prev) => {
        const diff = metric.value - prev;
        if (Math.abs(diff) < 0.1) return metric.value;
        return prev + diff * 0.2;
      });
    };

    const animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [metric.value]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);

    const centerX = rect.width / 2;
    const centerY = rect.height * 0.75;
    const radius = Math.min(rect.width, rect.height) * 0.35;

    ctx.clearRect(0, 0, rect.width, rect.height);

    const startAngle = Math.PI;
    const endAngle = 2 * Math.PI;

    const normalEnd = startAngle + (metric.warningThreshold - metric.min) / (metric.max - metric.min) * Math.PI;
    const warningEnd = startAngle + (metric.dangerThreshold - metric.min) / (metric.max - metric.min) * Math.PI;

    ctx.lineWidth = 20;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, normalEnd);
    ctx.strokeStyle = '#22c55e';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, normalEnd, warningEnd);
    ctx.strokeStyle = '#eab308';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, warningEnd, endAngle);
    ctx.strokeStyle = '#ef4444';
    ctx.stroke();

    const valueAngle = startAngle + (animatedValue - metric.min) / (metric.max - metric.min) * Math.PI;
    const needleLength = radius - 10;
    const needleEndX = centerX + needleLength * Math.cos(valueAngle);
    const needleEndY = centerY + needleLength * Math.sin(valueAngle);

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(needleEndX, needleEndY);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#1e293b';
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e293b';
    ctx.fill();

    [metric.warningThreshold, metric.dangerThreshold].forEach((threshold) => {
      const thresholdAngle = startAngle + (threshold - metric.min) / (metric.max - metric.min) * Math.PI;
      const markerStartRadius = radius - 25;
      const markerEndRadius = radius + 5;

      const startX = centerX + markerStartRadius * Math.cos(thresholdAngle);
      const startY = centerY + markerStartRadius * Math.sin(thresholdAngle);
      const endX = centerX + markerEndRadius * Math.cos(thresholdAngle);
      const endY = centerY + markerEndRadius * Math.sin(thresholdAngle);

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#64748b';
      ctx.stroke();
    });

    for (let i = 0; i <= 10; i++) {
      const angle = startAngle + (i / 10) * Math.PI;
      const tickStartRadius = radius + 5;
      const tickEndRadius = radius + 10;

      const startX = centerX + tickStartRadius * Math.cos(angle);
      const startY = centerY + tickStartRadius * Math.sin(angle);
      const endX = centerX + tickEndRadius * Math.cos(angle);
      const endY = centerY + tickEndRadius * Math.sin(angle);

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#94a3b8';
      ctx.stroke();
    }

    if (metric.status === 'critical') {
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ef4444';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 12, 0, 2 * Math.PI);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (metric.status === 'warning') {
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#eab308';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI);
      ctx.fillStyle = '#eab308';
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }, [animatedValue, metric]);

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

  const getStatusLabel = () => {
    switch (metric.status) {
      case 'critical':
        return 'CRITICAL';
      case 'warning':
        return 'WARNING';
      default:
        return 'NORMAL';
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{metric.name}</CardTitle>
          <Badge variant={getStatusColor()}>{getStatusLabel()}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full h-48"
            style={{ display: 'block' }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ top: '45%' }}>
            <div className="text-4xl font-bold">{animatedValue.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">{metric.unit}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {metric.min} - {metric.max} {metric.unit}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
