import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { zoneService } from '../services/zoneService'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  MapPinIcon,
  CubeIcon,
  BoltIcon,
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../components/LoadingSpinner'

const zoneSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  floor: z.string().min(1, 'Floor is required'),
  type: z.enum(['office', 'common_area', 'storage', 'technical', 'other'], {
    required_error: 'Zone type is required',
  }),
  area: z.number().min(1, 'Area must be at least 1 sq m').positive('Area must be positive'),
  targetTemperature: z.number().min(15, 'Temperature too low').max(30, 'Temperature too high').optional(),
  occupancyLimit: z.number().min(0, 'Occupancy limit cannot be negative').optional(),
})

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card rounded-lg border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-md transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

const ZoneForm = ({ zone, onSubmit, onCancel, isSubmitting }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(zoneSchema),
    defaultValues: zone || {
      name: '',
      description: '',
      floor: '',
      type: 'office',
      area: 0,
      targetTemperature: 22,
      occupancyLimit: 0,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Zone Name *
          </label>
          <input
            {...register('name')}
            type="text"
            className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="e.g., Office 101"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Floor *
          </label>
          <input
            {...register('floor')}
            type="text"
            className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="e.g., 1st Floor, Ground"
          />
          {errors.floor && (
            <p className="mt-1 text-sm text-destructive">{errors.floor.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Description
        </label>
        <textarea
          {...register('description')}
          rows={3}
          className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Brief description of the zone..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Zone Type *
          </label>
          <select
            {...register('type')}
            className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="office">Office</option>
            <option value="common_area">Common Area</option>
            <option value="storage">Storage</option>
            <option value="technical">Technical</option>
            <option value="other">Other</option>
          </select>
          {errors.type && (
            <p className="mt-1 text-sm text-destructive">{errors.type.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Area (sq m) *
          </label>
          <input
            {...register('area', { valueAsNumber: true })}
            type="number"
            step="0.01"
            className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="0"
          />
          {errors.area && (
            <p className="mt-1 text-sm text-destructive">{errors.area.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Target Temperature (C)
          </label>
          <input
            {...register('targetTemperature', { valueAsNumber: true })}
            type="number"
            step="0.5"
            className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="22"
          />
          {errors.targetTemperature && (
            <p className="mt-1 text-sm text-destructive">
              {errors.targetTemperature.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Occupancy Limit
          </label>
          <input
            {...register('occupancyLimit', { valueAsNumber: true })}
            type="number"
            className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="0"
          />
          {errors.occupancyLimit && (
            <p className="mt-1 text-sm text-destructive">
              {errors.occupancyLimit.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Saving...</span>
            </>
          ) : (
            <span>{zone ? 'Update Zone' : 'Create Zone'}</span>
          )}
        </button>
      </div>
    </form>
  )
}

const Zones = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedZone, setSelectedZone] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')

  const queryClient = useQueryClient()

  const { data: zones, isLoading } = useQuery({
    queryKey: ['zones'],
    queryFn: zoneService.getAllZones,
  })

  const createMutation = useMutation({
    mutationFn: zoneService.createZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] })
      setIsCreateModalOpen(false)
      toast.success('Zone created successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create zone')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => zoneService.updateZone(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] })
      setIsEditModalOpen(false)
      setSelectedZone(null)
      toast.success('Zone updated successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update zone')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: zoneService.deleteZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] })
      setIsDeleteModalOpen(false)
      setSelectedZone(null)
      toast.success('Zone deleted successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete zone')
    },
  })

  const handleEdit = (zone) => {
    setSelectedZone(zone)
    setIsEditModalOpen(true)
  }

  const handleDelete = (zone) => {
    setSelectedZone(zone)
    setIsDeleteModalOpen(true)
  }

  const handleCreateSubmit = (data) => {
    createMutation.mutate(data)
  }

  const handleUpdateSubmit = (data) => {
    updateMutation.mutate({ id: selectedZone.id, data })
  }

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(selectedZone.id)
  }

  const filteredZones = Array.isArray(zones) ? zones.filter((zone) => {
    const matchesSearch = zone.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zone.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || zone.type === filterType || !zone.type
    return matchesSearch && matchesType
  }) : []

  const getTypeColor = (type) => {
    const colors = {
      office: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      common_area: 'bg-green-500/10 text-green-600 border-green-500/20',
      storage: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      technical: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      other: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
    }
    return colors[type] || colors.other
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Zones</h1>
          <p className="text-muted-foreground">
            Manage building zones and their configurations
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add Zone</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search zones..."
            className="w-full px-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Types</option>
          <option value="office">Office</option>
          <option value="common_area">Common Area</option>
          <option value="storage">Storage</option>
          <option value="technical">Technical</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Zone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Floor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Area
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Target Temp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Occupancy
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredZones.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-muted-foreground">
                    {searchTerm || filterType !== 'all'
                      ? 'No zones found matching your criteria'
                      : 'No zones yet. Create your first zone to get started.'}
                  </td>
                </tr>
              ) : (
                filteredZones.map((zone) => (
                  <tr key={zone.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-primary/10 rounded-lg mr-3">
                          <MapPinIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {zone.name}
                          </div>
                          {zone.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {zone.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${getTypeColor(
                          zone.type
                        )}`}
                      >
                        {(zone.type || 'unknown').replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{zone.floor}</td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {zone.area} m<sup>2</sup>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {zone.targetTemperature ? `${zone.targetTemperature}°C` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {zone.currentOccupancy || 0} / {zone.occupancyLimit || '-'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(zone)}
                        className="text-primary hover:text-primary/80 mr-3"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(zone)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <CubeIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Zones</p>
              <p className="text-2xl font-bold text-foreground">{zones?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <MapPinIcon className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Area</p>
              <p className="text-2xl font-bold text-foreground">
                {zones?.reduce((sum, zone) => sum + (zone.area || 0), 0).toFixed(0) || 0} m
                <sup>2</sup>
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <BoltIcon className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Power/Zone</p>
              <p className="text-2xl font-bold text-foreground">
                {zones?.length
                  ? (
                      zones.reduce((sum, zone) => sum + (zone.currentPower || 0), 0) /
                      zones.length
                    ).toFixed(1)
                  : 0}{' '}
                kW
              </p>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Zone"
      >
        <ZoneForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateModalOpen(false)}
          isSubmitting={createMutation.isPending}
        />
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedZone(null)
        }}
        title="Edit Zone"
      >
        <ZoneForm
          zone={selectedZone}
          onSubmit={handleUpdateSubmit}
          onCancel={() => {
            setIsEditModalOpen(false)
            setSelectedZone(null)
          }}
          isSubmitting={updateMutation.isPending}
        />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedZone(null)
        }}
        title="Delete Zone"
      >
        <div className="space-y-4">
          <p className="text-foreground">
            Are you sure you want to delete the zone <strong>{selectedZone?.name}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false)
                setSelectedZone(null)
              }}
              className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {deleteMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Delete Zone</span>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Zones
