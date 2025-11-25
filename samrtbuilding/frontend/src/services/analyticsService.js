import api from './api'

export const analyticsService = {
  getDashboardStats: async () => {
    const response = await api.get('/analytics/dashboard')
    return response.data?.data || response.data
  },

  getConsumptionTrends: async (period) => {
    const response = await api.get('/analytics/trends', { params: { period } })
    return response.data?.data || response.data || []
  },

  getEfficiencyMetrics: async () => {
    const response = await api.get('/analytics/efficiency')
    return response.data?.data || response.data
  },

  getCostAnalysis: async (startDate, endDate) => {
    const response = await api.get('/analytics/cost', {
      params: { startDate, endDate }
    })
    return response.data?.data || response.data
  },

  getPeakDemandAnalysis: async () => {
    const response = await api.get('/analytics/peak-demand')
    return response.data?.data || response.data
  },

  generateReport: async (reportType, params) => {
    const response = await api.post('/analytics/reports', {
      type: reportType,
      ...params
    })
    return response.data?.data || response.data
  },
}
