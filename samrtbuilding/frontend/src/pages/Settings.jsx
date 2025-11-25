import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { settingsService } from '../services/settingsService'
import {
  BellIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../components/LoadingSpinner'

const energyTargetSchema = z.object({
  dailyTarget: z.number().min(0, 'Target must be positive'),
  monthlyTarget: z.number().min(0, 'Target must be positive'),
  peakDemandLimit: z.number().min(0, 'Limit must be positive'),
  costBudget: z.number().min(0, 'Budget must be positive'),
})

const TabButton = ({ active, onClick, icon: Icon, children }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
      active
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span>{children}</span>
  </button>
)


const NotificationsTab = () => {
  const queryClient = useQueryClient()

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: settingsService.getNotificationPreferences,
  })

  const [localPreferences, setLocalPreferences] = useState(preferences || {})

  const updateMutation = useMutation({
    mutationFn: settingsService.updateNotificationPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] })
      toast.success('Notification preferences updated')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update preferences')
    },
  })

  const handleToggle = (key) => {
    const updated = { ...localPreferences, [key]: !localPreferences[key] }
    setLocalPreferences(updated)
  }

  const handleSave = () => {
    updateMutation.mutate(localPreferences)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const notificationOptions = [
    {
      key: 'emailAlerts',
      title: 'Email Alerts',
      description: 'Receive email notifications for critical alerts',
    },
    {
      key: 'pushNotifications',
      title: 'Push Notifications',
      description: 'Browser push notifications for real-time updates',
    },
    {
      key: 'dailyReport',
      title: 'Daily Energy Report',
      description: 'Receive daily summary of energy consumption',
    },
    {
      key: 'weeklyReport',
      title: 'Weekly Report',
      description: 'Get weekly analytics and insights',
    },
    {
      key: 'alertsOnHigh',
      title: 'High Consumption Alerts',
      description: 'Notify when consumption exceeds threshold',
    },
    {
      key: 'alertsOnAnomaly',
      title: 'Anomaly Detection',
      description: 'Alert on unusual consumption patterns',
    },
    {
      key: 'maintenanceReminders',
      title: 'Maintenance Reminders',
      description: 'Equipment maintenance schedule notifications',
    },
    {
      key: 'systemUpdates',
      title: 'System Updates',
      description: 'Notifications about system updates and changes',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Notification Preferences</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Configure how you want to receive notifications
        </p>

        <div className="space-y-4">
          {notificationOptions.map((option) => (
            <div
              key={option.key}
              className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
            >
              <div className="flex-1">
                <h3 className="text-sm font-medium text-foreground mb-1">{option.title}</h3>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
              <button
                onClick={() => handleToggle(option.key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localPreferences[option.key] ? 'bg-primary' : 'bg-secondary'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localPreferences[option.key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {updateMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Preferences</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

const EnergyTargetsTab = () => {
  const queryClient = useQueryClient()

  const { data: targets, isLoading } = useQuery({
    queryKey: ['energyTargets'],
    queryFn: settingsService.getEnergyTargets,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(energyTargetSchema),
    defaultValues: targets || {
      dailyTarget: 0,
      monthlyTarget: 0,
      peakDemandLimit: 0,
      costBudget: 0,
    },
  })

  const updateMutation = useMutation({
    mutationFn: settingsService.updateEnergyTargets,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['energyTargets'] })
      toast.success('Energy targets updated successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update targets')
    },
  })

  const onSubmit = (data) => {
    updateMutation.mutate(data)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Energy Targets</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Set consumption and budget targets for monitoring
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Daily Target (kWh) *
              </label>
              <input
                {...register('dailyTarget', { valueAsNumber: true })}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="0.00"
              />
              {errors.dailyTarget && (
                <p className="mt-1 text-sm text-destructive">{errors.dailyTarget.message}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Current: {targets?.currentDaily?.toFixed(2) || 0} kWh
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Monthly Target (kWh) *
              </label>
              <input
                {...register('monthlyTarget', { valueAsNumber: true })}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="0.00"
              />
              {errors.monthlyTarget && (
                <p className="mt-1 text-sm text-destructive">{errors.monthlyTarget.message}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Current: {targets?.currentMonthly?.toFixed(2) || 0} kWh
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Peak Demand Limit (kW) *
              </label>
              <input
                {...register('peakDemandLimit', { valueAsNumber: true })}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="0.00"
              />
              {errors.peakDemandLimit && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.peakDemandLimit.message}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Current Peak: {targets?.currentPeak?.toFixed(2) || 0} kW
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Monthly Budget ($) *
              </label>
              <input
                {...register('costBudget', { valueAsNumber: true })}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="0.00"
              />
              {errors.costBudget && (
                <p className="mt-1 text-sm text-destructive">{errors.costBudget.message}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Current Spend: ${targets?.currentSpend?.toFixed(2) || 0}
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {updateMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Targets</span>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Target Progress</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-foreground">Daily Target</span>
              <span className="text-sm font-medium text-foreground">
                {targets?.dailyProgress || 0}%
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  (targets?.dailyProgress || 0) > 100
                    ? 'bg-destructive'
                    : (targets?.dailyProgress || 0) > 80
                    ? 'bg-orange-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(targets?.dailyProgress || 0, 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-foreground">Monthly Target</span>
              <span className="text-sm font-medium text-foreground">
                {targets?.monthlyProgress || 0}%
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  (targets?.monthlyProgress || 0) > 100
                    ? 'bg-destructive'
                    : (targets?.monthlyProgress || 0) > 80
                    ? 'bg-orange-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(targets?.monthlyProgress || 0, 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-foreground">Budget Usage</span>
              <span className="text-sm font-medium text-foreground">
                {targets?.budgetProgress || 0}%
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  (targets?.budgetProgress || 0) > 100
                    ? 'bg-destructive'
                    : (targets?.budgetProgress || 0) > 80
                    ? 'bg-orange-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(targets?.budgetProgress || 0, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const Settings = () => {
  const [activeTab, setActiveTab] = useState('notifications')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage system settings and preferences
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 bg-card rounded-lg border border-border p-2">
        <TabButton
          active={activeTab === 'notifications'}
          onClick={() => setActiveTab('notifications')}
          icon={BellIcon}
        >
          Notifications
        </TabButton>
        <TabButton
          active={activeTab === 'targets'}
          onClick={() => setActiveTab('targets')}
          icon={ChartBarIcon}
        >
          Energy Targets
        </TabButton>
      </div>

      <div>
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'targets' && <EnergyTargetsTab />}
      </div>
    </div>
  )
}

export default Settings
