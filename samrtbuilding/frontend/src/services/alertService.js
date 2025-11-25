import api from './api'

export const alertService = {
  getAllAlerts: async (params) => {
    const response = await api.get('/alerts', { params })
    return response.data?.data || response.data || []
  },

  getAlert: async (id) => {
    const response = await api.get(`/alerts/${id}`)
    return response.data?.data || response.data
  },

  acknowledgeAlert: async (id) => {
    const response = await api.post(`/alerts/${id}/acknowledge`)
    return response.data
  },

  resolveAlert: async (id, resolution) => {
    const response = await api.post(`/alerts/${id}/resolve`, { resolution })
    return response.data
  },

  createAlertRule: async (ruleData) => {
    const response = await api.post('/alerts/rules', ruleData)
    return response.data
  },

  updateAlertRule: async (id, ruleData) => {
    const response = await api.put(`/alerts/rules/${id}`, ruleData)
    return response.data
  },

  deleteAlertRule: async (id) => {
    const response = await api.delete(`/alerts/rules/${id}`)
    return response.data
  },

  getAlertRules: async () => {
    const response = await api.get('/alerts/rules')
    return response.data
  },
}
