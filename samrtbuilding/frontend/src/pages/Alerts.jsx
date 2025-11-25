import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { alertService } from '../services/alertService'
import {
  BellAlertIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../components/LoadingSpinner'

const getSeverityConfig = (severity) => {
  const configs = {
    critical: {
      icon: XCircleIcon,
      className: 'bg-destructive/10 text-destructive border-destructive/20',
      dotClass: 'bg-destructive',
    },
    warning: {
      icon: ExclamationTriangleIcon,
      className: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      dotClass: 'bg-orange-500',
    },
    info: {
      icon: BellAlertIcon,
      className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      dotClass: 'bg-blue-500',
    },
  }
  return configs[severity] || configs.info
}

const AlertCard = ({ alert, onAcknowledge, onResolve, isProcessing }) => {
  const [showResolveForm, setShowResolveForm] = useState(false)
  const [resolution, setResolution] = useState('')

  const severityConfig = getSeverityConfig(alert.severity)
  const Icon = severityConfig.icon

  const handleResolve = () => {
    if (resolution.trim()) {
      onResolve(alert.id, resolution)
      setShowResolveForm(false)
      setResolution('')
    } else {
      toast.error('Please provide a resolution note')
    }
  }

  const getStatusBadge = () => {
    if (alert.status === 'resolved') {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-green-500/10 text-green-600 border border-green-500/20">
          <CheckCircleIcon className="w-3 h-3 mr-1" />
          Resolved
        </span>
      )
    }
    if (alert.status === 'acknowledged') {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-blue-500/10 text-blue-600 border border-blue-500/20">
          Acknowledged
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-orange-500/10 text-orange-600 border border-orange-500/20">
        Active
      </span>
    )
  }

  return (
    <div className={`bg-card rounded-lg border p-4 ${severityConfig.className.includes('destructive') ? 'border-destructive/20' : 'border-border'}`}>
      <div className="flex items-start space-x-4">
        <div className={`flex-shrink-0 p-2 rounded-lg ${severityConfig.className}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-sm font-semibold text-foreground">{alert.title}</h3>
                {getStatusBadge()}
              </div>
              <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span className="flex items-center">
                  <ClockIcon className="w-3 h-3 mr-1" />
                  {new Date(alert.timestamp).toLocaleString()}
                </span>
                {alert.source && (
                  <span className="flex items-center">
                    <span className={`w-2 h-2 rounded-full ${severityConfig.dotClass} mr-1`} />
                    {alert.source}
                  </span>
                )}
                {alert.zone && (
                  <span className="px-2 py-0.5 bg-muted rounded text-foreground">
                    {alert.zone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {alert.details && (
            <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-foreground">
              <p className="font-medium mb-1">Details:</p>
              <p>{alert.details}</p>
            </div>
          )}

          {alert.status === 'resolved' && alert.resolution && (
            <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded text-xs">
              <p className="font-medium text-green-600 mb-1">Resolution:</p>
              <p className="text-green-600">{alert.resolution}</p>
              {alert.resolvedAt && (
                <p className="text-green-600/70 mt-1">
                  Resolved: {new Date(alert.resolvedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {alert.status === 'active' && !showResolveForm && (
            <div className="flex items-center space-x-2 mt-3">
              <button
                onClick={() => onAcknowledge(alert.id)}
                disabled={isProcessing}
                className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                Acknowledge
              </button>
              <button
                onClick={() => setShowResolveForm(true)}
                disabled={isProcessing}
                className="px-3 py-1.5 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                Resolve
              </button>
            </div>
          )}

          {alert.status === 'acknowledged' && !showResolveForm && (
            <div className="flex items-center space-x-2 mt-3">
              <button
                onClick={() => setShowResolveForm(true)}
                disabled={isProcessing}
                className="px-3 py-1.5 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                Resolve
              </button>
            </div>
          )}

          {showResolveForm && (
            <div className="mt-3 space-y-2">
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Describe how this alert was resolved..."
                rows={3}
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleResolve}
                  disabled={isProcessing}
                  className="px-3 py-1.5 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Resolving...' : 'Submit Resolution'}
                </button>
                <button
                  onClick={() => {
                    setShowResolveForm(false)
                    setResolution('')
                  }}
                  className="px-3 py-1.5 text-xs border border-border rounded hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const Alerts = () => {
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [processingAlertId, setProcessingAlertId] = useState(null)

  const queryClient = useQueryClient()

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts', { status: filterStatus, severity: filterSeverity }],
    queryFn: () =>
      alertService.getAllAlerts({
        status: filterStatus !== 'all' ? filterStatus : undefined,
        severity: filterSeverity !== 'all' ? filterSeverity : undefined,
      }),
    refetchInterval: 15000, // Refetch every 15 seconds
  })

  const acknowledgeMutation = useMutation({
    mutationFn: alertService.acknowledgeAlert,
    onMutate: (alertId) => {
      setProcessingAlertId(alertId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      toast.success('Alert acknowledged')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to acknowledge alert')
    },
    onSettled: () => {
      setProcessingAlertId(null)
    },
  })

  const resolveMutation = useMutation({
    mutationFn: ({ id, resolution }) => alertService.resolveAlert(id, resolution),
    onMutate: ({ id }) => {
      setProcessingAlertId(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      toast.success('Alert resolved successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to resolve alert')
    },
    onSettled: () => {
      setProcessingAlertId(null)
    },
  })

  const handleAcknowledge = (id) => {
    acknowledgeMutation.mutate(id)
  }

  const handleResolve = (id, resolution) => {
    resolveMutation.mutate({ id, resolution })
  }

  const alertsArray = Array.isArray(alerts) ? alerts : []

  const filteredAlerts = alertsArray.filter((alert) => {
    const matchesSearch =
      alert.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.source?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const stats = {
    total: alertsArray.length,
    active: alertsArray.filter((a) => a.status === 'active').length,
    acknowledged: alertsArray.filter((a) => a.status === 'acknowledged').length,
    resolved: alertsArray.filter((a) => a.status === 'resolved').length,
    critical: alertsArray.filter((a) => a.severity === 'critical').length,
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Alerts</h1>
          <p className="text-muted-foreground">
            Monitor and manage system alerts and notifications
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Alerts</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <BellAlertIcon className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Active</p>
              <p className="text-2xl font-bold text-orange-500">{stats.active}</p>
            </div>
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Critical</p>
              <p className="text-2xl font-bold text-destructive">{stats.critical}</p>
            </div>
            <div className="p-3 bg-destructive/10 rounded-lg">
              <XCircleIcon className="w-6 h-6 text-destructive" />
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Resolved</p>
              <p className="text-2xl font-bold text-green-500">{stats.resolved}</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search alerts..."
            className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      {stats.critical > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <XCircleIcon className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-destructive mb-1">
                Critical Alerts Require Attention
              </h3>
              <p className="text-sm text-destructive">
                There {stats.critical === 1 ? 'is' : 'are'} {stats.critical} critical alert
                {stats.critical === 1 ? '' : 's'} that require immediate attention.
              </p>
            </div>
          </div>
        </div>
      )}

      {filteredAlerts.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {searchTerm || filterStatus !== 'all' || filterSeverity !== 'all'
              ? 'No Alerts Found'
              : 'All Clear'}
          </h3>
          <p className="text-muted-foreground">
            {searchTerm || filterStatus !== 'all' || filterSeverity !== 'all'
              ? 'Try adjusting your filters'
              : 'There are no alerts at the moment'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={handleAcknowledge}
              onResolve={handleResolve}
              isProcessing={processingAlertId === alert.id}
            />
          ))}
        </div>
      )}

      <div className="bg-card rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">Alert Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Response Rate</p>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-secondary rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${
                      stats.total > 0
                        ? ((stats.acknowledged + stats.resolved) / stats.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <span className="text-xs font-medium text-foreground">
                {stats.total > 0
                  ? Math.round(((stats.acknowledged + stats.resolved) / stats.total) * 100)
                  : 0}
                %
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Resolution Rate</p>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-secondary rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{
                    width: `${stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-xs font-medium text-foreground">
                {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Average Response Time</p>
            <p className="text-sm font-semibold text-foreground">
              {alerts?.length > 0
                ? `${Math.round(
                    alerts.reduce((sum, a) => sum + (a.responseTime || 0), 0) / alerts.length
                  )} min`
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Alerts
