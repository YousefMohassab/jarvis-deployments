import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { equipmentService } from '../services/equipmentService'
import {
  PowerIcon,
  StopIcon,
  ArrowPathIcon,
  BoltIcon,
  SignalIcon,
  ClockIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../components/LoadingSpinner'

const StatusBadge = ({ status }) => {
  const statusConfig = {
    online: {
      label: 'Online',
      className: 'bg-green-500/10 text-green-600 border-green-500/20',
    },
    offline: {
      label: 'Offline',
      className: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
    },
    maintenance: {
      label: 'Maintenance',
      className: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    },
    error: {
      label: 'Error',
      className: 'bg-destructive/10 text-destructive border-destructive/20',
    },
  }

  const config = statusConfig[status] || statusConfig.offline

  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md border ${config.className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      {config.label}
    </span>
  )
}

const EquipmentCard = ({ equipment, onControl }) => {
  const [isControlling, setIsControlling] = useState(false)

  const handleControl = async (command) => {
    setIsControlling(true)
    try {
      await onControl(equipment.id, command)
    } finally {
      setIsControlling(false)
    }
  }

  const getTypeIcon = () => {
    const iconMap = {
      hvac: '❄️',
      lighting: '💡',
      elevator: '🛗',
      pump: '⚙️',
      generator: '⚡',
      sensor: '📡',
    }
    return iconMap[equipment.type] || '🔧'
  }

  const isControllable = equipment.status === 'online'

  return (
    <div className="bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-3xl">{getTypeIcon()}</div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{equipment.name}</h3>
            <p className="text-sm text-muted-foreground">{equipment.location}</p>
          </div>
        </div>
        <StatusBadge status={equipment.status} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-1">
          <div className="flex items-center text-xs text-muted-foreground">
            <BoltIcon className="w-4 h-4 mr-1" />
            <span>Power</span>
          </div>
          <p className="text-lg font-semibold text-foreground">
            {equipment.currentPower?.toFixed(1) || 0} kW
          </p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center text-xs text-muted-foreground">
            <SignalIcon className="w-4 h-4 mr-1" />
            <span>Efficiency</span>
          </div>
          <p className="text-lg font-semibold text-foreground">
            {equipment.efficiency || 0}%
          </p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center text-xs text-muted-foreground">
            <ClockIcon className="w-4 h-4 mr-1" />
            <span>Runtime</span>
          </div>
          <p className="text-sm text-foreground">
            {equipment.runtime ? `${Math.floor(equipment.runtime / 60)}h ${equipment.runtime % 60}m` : 'N/A'}
          </p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center text-xs text-muted-foreground">
            <span>Type</span>
          </div>
          <p className="text-sm text-foreground capitalize">
            {(equipment.type || 'unknown').replace('_', ' ')}
          </p>
        </div>
      </div>

      {equipment.lastMaintenance && (
        <div className="mb-4 p-3 bg-muted/50 rounded-md">
          <p className="text-xs text-muted-foreground mb-1">Last Maintenance</p>
          <p className="text-sm text-foreground">
            {new Date(equipment.lastMaintenance).toLocaleDateString()}
          </p>
        </div>
      )}

      <div className="flex space-x-2">
        <button
          onClick={() => handleControl('start')}
          disabled={!isControllable || isControlling || equipment.isRunning}
          className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <PowerIcon className="w-4 h-4" />
          <span>Start</span>
        </button>
        <button
          onClick={() => handleControl('stop')}
          disabled={!isControllable || isControlling || !equipment.isRunning}
          className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <StopIcon className="w-4 h-4" />
          <span>Stop</span>
        </button>
        <button
          onClick={() => handleControl('restart')}
          disabled={!isControllable || isControlling}
          className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <ArrowPathIcon className="w-4 h-4" />
          <span>Restart</span>
        </button>
      </div>

      {equipment.alerts?.length > 0 && (
        <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-md">
          <p className="text-xs font-medium text-orange-600 mb-1">Active Alerts</p>
          {equipment.alerts.map((alert, index) => (
            <p key={index} className="text-xs text-orange-600">
              • {alert}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

const Equipment = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'

  const queryClient = useQueryClient()

  const { data: equipment, isLoading } = useQuery({
    queryKey: ['equipment'],
    queryFn: equipmentService.getAllEquipment,
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
  })

  const controlMutation = useMutation({
    mutationFn: ({ id, command }) => equipmentService.controlEquipment(id, command),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      const commandLabels = {
        start: 'started',
        stop: 'stopped',
        restart: 'restarted',
      }
      toast.success(`Equipment ${commandLabels[variables.command]} successfully`)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to control equipment')
    },
  })

  const handleControl = (id, command) => {
    controlMutation.mutate({ id, command })
  }

  const equipmentArray = Array.isArray(equipment) ? equipment : []

  const filteredEquipment = equipmentArray.filter((item) => {
    const matchesSearch =
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus
    const matchesType = filterType === 'all' || item.type === filterType
    return matchesSearch && matchesStatus && matchesType
  })

  const stats = {
    total: equipmentArray.length,
    online: equipmentArray.filter((e) => e.status === 'online').length,
    offline: equipmentArray.filter((e) => e.status === 'offline').length,
    maintenance: equipmentArray.filter((e) => e.status === 'maintenance').length,
    totalPower: equipmentArray.reduce((sum, e) => sum + (e.currentPower || e.powerConsumption || 0), 0).toFixed(1),
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Equipment</h1>
          <p className="text-muted-foreground">
            Monitor and control building equipment systems
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Equipment</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <BoltIcon className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Online</p>
              <p className="text-2xl font-bold text-green-500">{stats.online}</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <SignalIcon className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Offline</p>
              <p className="text-2xl font-bold text-gray-500">{stats.offline}</p>
            </div>
            <div className="p-3 bg-gray-500/10 rounded-lg">
              <StopIcon className="w-6 h-6 text-gray-500" />
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Power</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalPower} kW</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <BoltIcon className="w-6 h-6 text-blue-500" />
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
            placeholder="Search equipment..."
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
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="maintenance">Maintenance</option>
            <option value="error">Error</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Types</option>
            <option value="hvac">HVAC</option>
            <option value="lighting">Lighting</option>
            <option value="elevator">Elevator</option>
            <option value="pump">Pump</option>
            <option value="generator">Generator</option>
            <option value="sensor">Sensor</option>
          </select>
        </div>
      </div>

      {filteredEquipment.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <BoltIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Equipment Found</h3>
          <p className="text-muted-foreground">
            {searchTerm || filterStatus !== 'all' || filterType !== 'all'
              ? 'Try adjusting your filters'
              : 'No equipment has been added yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipment.map((item) => (
            <EquipmentCard key={item.id} equipment={item} onControl={handleControl} />
          ))}
        </div>
      )}

      {equipment?.some((e) => e.status === 'maintenance') && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="w-6 h-6 text-orange-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-orange-600 mb-1">
                Maintenance Required
              </h3>
              <p className="text-sm text-orange-600">
                {equipment.filter((e) => e.status === 'maintenance').length} equipment
                item(s) are currently under maintenance. Some features may be limited.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Equipment
