import api from './api'

export const equipmentService = {
  getAllEquipment: async () => {
    const response = await api.get('/equipment')
    return response.data?.data || response.data || []
  },

  getEquipment: async (id) => {
    const response = await api.get(`/equipment/${id}`)
    return response.data?.data || response.data
  },

  createEquipment: async (equipmentData) => {
    const response = await api.post('/equipment', equipmentData)
    return response.data?.data || response.data
  },

  updateEquipment: async (id, equipmentData) => {
    const response = await api.put(`/equipment/${id}`, equipmentData)
    return response.data?.data || response.data
  },

  deleteEquipment: async (id) => {
    const response = await api.delete(`/equipment/${id}`)
    return response.data?.data || response.data
  },

  controlEquipment: async (id, command) => {
    const response = await api.post(`/equipment/${id}/control`, { command })
    return response.data?.data || response.data
  },

  getEquipmentStatus: async (id) => {
    const response = await api.get(`/equipment/${id}/status`)
    return response.data?.data || response.data
  },
}
