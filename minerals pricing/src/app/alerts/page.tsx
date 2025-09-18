'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bell, BellRing, Plus, Search, Trash2, Power, PowerOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AlertsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [alerts, setAlerts] = useState([
    {
      id: '1',
      name: 'Gold Above $2050',
      mineralName: 'Gold',
      type: 'above',
      threshold: 2050,
      currentPrice: 2045.50,
      isActive: true,
      isTriggered: false,
      createdAt: '2024-12-15T14:20:00Z',
      triggerCount: 3
    },
    {
      id: '2', 
      name: 'Silver Below $25',
      mineralName: 'Silver',
      type: 'below',
      threshold: 25,
      currentPrice: 24.85,
      isActive: true,
      isTriggered: true,
      createdAt: '2024-12-20T09:45:00Z',
      triggerCount: 1
    },
    {
      id: '3',
      name: 'Copper 2% Change Alert',
      mineralName: 'Copper',
      type: 'change_percent',
      threshold: 2,
      currentPrice: 4.12,
      isActive: false,
      isTriggered: false,
      createdAt: '2024-12-10T16:30:00Z',
      triggerCount: 0
    }
  ])

  const [newAlert, setNewAlert] = useState({
    name: '',
    mineral: '',
    type: 'above',
    threshold: 0
  })

  const handleCreateAlert = () => {
    if (!newAlert.name || !newAlert.mineral || !newAlert.threshold) return

    const alert = {
      id: Date.now().toString(),
      name: newAlert.name,
      mineralName: newAlert.mineral,
      type: newAlert.type,
      threshold: newAlert.threshold,
      currentPrice: 2000, // Mock current price
      isActive: true,
      isTriggered: false,
      createdAt: new Date().toISOString(),
      triggerCount: 0
    }

    setAlerts([alert, ...alerts])
    setIsCreateModalOpen(false)
    setNewAlert({ name: '', mineral: '', type: 'above', threshold: 0 })
  }

  const toggleAlert = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, isActive: !alert.isActive } : alert
    ))
  }

  const deleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id))
  }

  const getTypeBadge = (type: string) => {
    const colors = {
      above: 'bg-green-100 text-green-800',
      below: 'bg-red-100 text-red-800',
      change_percent: 'bg-blue-100 text-blue-800'
    } as const
    
    const labels = {
      above: 'Above Threshold',
      below: 'Below Threshold', 
      change_percent: 'Percentage Change'
    } as const

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colors[type as keyof typeof colors]}`}>
        {labels[type as keyof typeof labels]}
      </span>
    )
  }

  const filteredAlerts = alerts.filter(alert =>
    alert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alert.mineralName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Price Alerts</h1>
              <p className="text-gray-600">Monitor mineral prices and get notified when thresholds are met</p>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Alert
              </Button>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search criteria' : 'Create your first price alert to get started'}
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div key={alert.id} className={`bg-white rounded-lg shadow p-6 hover:shadow-lg transition-all ${
                alert.isTriggered && alert.isActive ? 'ring-2 ring-red-200 bg-red-50' : ''
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        {alert.isTriggered && alert.isActive ? (
                          <BellRing className="h-5 w-5 text-red-500" />
                        ) : (
                          <Bell className="h-5 w-5 text-gray-400" />
                        )}
                        <h3 className="font-semibold text-lg text-gray-900">{alert.name}</h3>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getTypeBadge(alert.type)}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          alert.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {alert.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {alert.isTriggered && alert.isActive && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Triggered
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <span className="font-medium">Mineral: </span>
                          {alert.mineralName}
                        </div>
                        <div>
                          <span className="font-medium">Threshold: </span>
                          {alert.type === 'change_percent' ? `${alert.threshold}%` : `$${alert.threshold.toFixed(2)}`}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <span className="font-medium">Current Price: </span>
                          <span className={alert.isTriggered && alert.isActive ? 'text-red-600 font-semibold' : ''}>
                            ${alert.currentPrice.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Triggered: </span>
                          {alert.triggerCount} times
                        </div>
                      </div>
                      
                      <div>
                        <span className="font-medium">Created: </span>
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAlert(alert.id)}
                    >
                      {alert.isActive ? (
                        <>
                          <PowerOff className="h-4 w-4 mr-2" />
                          Disable
                        </>
                      ) : (
                        <>
                          <Power className="h-4 w-4 mr-2" />
                          Enable
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteAlert(alert.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Alert Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Alert</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alert Name</label>
                <input
                  type="text"
                  placeholder="Enter alert name"
                  value={newAlert.name}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mineral</label>
                <select 
                  value={newAlert.mineral}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, mineral: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select mineral</option>
                  <option value="Gold">Gold</option>
                  <option value="Silver">Silver</option>
                  <option value="Copper">Copper</option>
                  <option value="Platinum">Platinum</option>
                  <option value="Palladium">Palladium</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alert Type</label>
                <select 
                  value={newAlert.type}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="above">Price Above Threshold</option>
                  <option value="below">Price Below Threshold</option>
                  <option value="change_percent">Percentage Change</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Threshold {newAlert.type === 'change_percent' ? '(%)' : '($)'}
                </label>
                <input
                  type="number"
                  step={newAlert.type === 'change_percent' ? '0.1' : '0.01'}
                  placeholder={newAlert.type === 'change_percent' ? 'e.g., 2.5' : 'e.g., 2000.00'}
                  value={newAlert.threshold || ''}
                  onChange={(e) => setNewAlert(prev => ({ 
                    ...prev, 
                    threshold: parseFloat(e.target.value) || 0 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateAlert}
                disabled={!newAlert.name || !newAlert.mineral || !newAlert.threshold}
              >
                Create Alert
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}