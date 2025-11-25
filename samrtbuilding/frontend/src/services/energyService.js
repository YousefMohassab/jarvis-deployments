import api from './api'

export const energyService = {
  getEnergyData: async (params) => {
    const response = await api.get('/energy', { params })
    return response.data?.data || response.data
  },

  getCurrentUsage: async () => {
    const response = await api.get('/energy/current')
    return response.data?.data || response.data
  },

  getHistoricalData: async (startDate, endDate, granularity = 'hour') => {
    const response = await api.get('/energy/historical', {
      params: { startDate, endDate, granularity }
    })
    return response.data?.data || response.data || []
  },

  getPredictions: async (horizon = '24h') => {
    const response = await api.get('/energy/predictions', {
      params: { horizon }
    })
    return response.data?.data || response.data
  },

  getZoneConsumption: async (zoneId) => {
    const response = await api.get(`/energy/zones/${zoneId}`)
    return response.data?.data || response.data
  },

  getEquipmentConsumption: async (equipmentId) => {
    const response = await api.get(`/energy/equipment/${equipmentId}`)
    return response.data?.data || response.data
  },
}
