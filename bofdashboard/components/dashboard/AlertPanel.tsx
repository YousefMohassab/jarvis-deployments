'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert as AlertType } from '@/types';
import { AlertCircle, AlertTriangle, Info, CheckCircle, X } from 'lucide-react';
import { formatTimestamp } from '@/lib/utils';

interface AlertPanelProps {
  alerts: AlertType[];
  onAcknowledge: (alertId: string) => void;
  onDismiss: (alertId: string) => void;
}

export function AlertPanel({ alerts, onAcknowledge, onDismiss }: AlertPanelProps) {
  const getAlertIcon = (severity: AlertType['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: AlertType['severity']) => {
    const variants = {
      critical: 'destructive',
      warning: 'default',
      info: 'secondary',
    } as const;

    return (
      <Badge variant={variants[severity]} className="text-xs">
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const activeAlerts = alerts.filter(alert => !alert.acknowledged);
  const acknowledgedAlerts = alerts.filter(alert => alert.acknowledged);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">System Alerts</CardTitle>
          <Badge variant="outline" className="text-xs">
            {activeAlerts.length} Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {activeAlerts.length === 0 && acknowledgedAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mb-2" />
              <p className="text-sm">No alerts</p>
              <p className="text-xs">System operating normally</p>
            </div>
          ) : (
            <>
              {activeAlerts.map((alert) => (
                <Alert
                  key={alert.id}
                  variant={alert.severity === 'critical' ? 'destructive' : 'default'}
                  className="relative"
                >
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.severity)}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <AlertTitle className="text-sm font-semibold">
                          {getSeverityBadge(alert.severity)}
                        </AlertTitle>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => onDismiss(alert.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <AlertDescription className="text-sm">
                        {alert.message}
                      </AlertDescription>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(alert.timestamp)}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => onAcknowledge(alert.id)}
                        >
                          Acknowledge
                        </Button>
                      </div>
                    </div>
                  </div>
                </Alert>
              ))}

              {acknowledgedAlerts.length > 0 && (
                <>
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Acknowledged ({acknowledgedAlerts.length})
                    </p>
                  </div>
                  {acknowledgedAlerts.slice(0, 5).map((alert) => (
                    <Alert key={alert.id} className="opacity-60 relative">
                      <div className="flex items-start gap-3">
                        {getAlertIcon(alert.severity)}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <AlertTitle className="text-sm font-semibold">
                              {getSeverityBadge(alert.severity)}
                            </AlertTitle>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => onDismiss(alert.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <AlertDescription className="text-sm">
                            {alert.message}
                          </AlertDescription>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(alert.timestamp)}
                          </span>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
