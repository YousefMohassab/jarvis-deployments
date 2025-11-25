import api from './api'

export const zoneService = {
  getAllZones: async () => {
    const response = await api.get('/zones')
    return response.data?.data || response.data || []
  },

  getZone: async (id) => {
    const response = await api.get(`/zones/${id}`)
    return response.data?.data || response.data
  },

  createZone: async (zoneData) => {
    const response = await api.post('/zones', zoneData)
    return response.data?.data || response.data
  },

  updateZone: async (id, zoneData) => {
    const response = await api.put(`/zones/${id}`, zoneData)
    return response.data?.data || response.data
  },

  deleteZone: async (id) => {
    const response = await api.delete(`/zones/${id}`)
    return response.data?.data || response.data
  },

  getZoneEquipment: async (id) => {
    const response = await api.get(`/zones/${id}/equipment`)
    return response.data?.data || response.data || []
  },
}
