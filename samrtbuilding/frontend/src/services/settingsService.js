import api from './api'

export const settingsService = {
  getSettings: async () => {
    const response = await api.get('/settings')
    return response.data
  },

  updateSettings: async (settings) => {
    const response = await api.put('/settings', settings)
    return response.data
  },

  getNotificationPreferences: async () => {
    const response = await api.get('/settings/notifications')
    return response.data
  },

  updateNotificationPreferences: async (preferences) => {
    const response = await api.put('/settings/notifications', preferences)
    return response.data
  },

  getEnergyTargets: async () => {
    const response = await api.get('/settings/targets')
    return response.data
  },

  updateEnergyTargets: async (targets) => {
    const response = await api.put('/settings/targets', targets)
    return response.data
  },
}
