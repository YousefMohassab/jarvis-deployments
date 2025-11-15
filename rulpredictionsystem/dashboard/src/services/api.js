/**
 * API Service for RUL Prediction System
 * Handles all HTTP requests to the FastAPI backend
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  /**
   * Generic request handler with error handling
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail ||
          errorData.message ||
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      }
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    return this.request('/health');
  }

  /**
   * Get all bearings
   */
  async getBearings() {
    return this.request('/bearings');
  }

  /**
   * Get specific bearing
   */
  async getBearing(bearingId) {
    return this.request(`/bearings/${bearingId}`);
  }

  /**
   * Get predictions for a bearing
   */
  async getPredictions(bearingId, limit = 50) {
    return this.request(`/bearings/${bearingId}/predictions?limit=${limit}`);
  }

  /**
   * Get latest prediction for a bearing
   */
  async getLatestPrediction(bearingId) {
    return this.request(`/bearings/${bearingId}/predictions/latest`);
  }

  /**
   * Create a new prediction
   */
  async createPrediction(bearingId, data) {
    return this.request(`/bearings/${bearingId}/predict`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get all alerts
   */
  async getAlerts(limit = 20) {
    return this.request(`/alerts?limit=${limit}`);
  }

  /**
   * Get alerts for a specific bearing
   */
  async getBearingAlerts(bearingId, limit = 20) {
    return this.request(`/alerts?bearing_id=${bearingId}&limit=${limit}`);
  }

  /**
   * Get active alerts only
   */
  async getActiveAlerts() {
    return this.request('/alerts?active_only=true');
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId) {
    return this.request(`/alerts/${alertId}/acknowledge`, {
      method: 'POST',
    });
  }

  /**
   * Get feature importance for a bearing
   */
  async getFeatureImportance(bearingId) {
    return this.request(`/bearings/${bearingId}/feature-importance`);
  }

  /**
   * Get system statistics
   */
  async getSystemStats() {
    return this.request('/stats');
  }

  /**
   * Upload sensor data file
   */
  async uploadData(file, bearingId) {
    const formData = new FormData();
    formData.append('file', file);
    if (bearingId) {
      formData.append('bearing_id', bearingId);
    }

    return fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      body: formData,
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Upload failed');
      }
      return response.json();
    });
  }

  /**
   * Trigger model training
   */
  async trainModel(config = {}) {
    return this.request('/train', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  /**
   * Get model information
   */
  async getModelInfo() {
    return this.request('/model/info');
  }

  /**
   * Batch predict for multiple bearings
   */
  async batchPredict(data) {
    return this.request('/predict/batch', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Export data
   */
  async exportData(bearingId, format = 'csv', startDate = null, endDate = null) {
    let endpoint = `/export/${format}?bearing_id=${bearingId}`;
    if (startDate) endpoint += `&start_date=${startDate}`;
    if (endDate) endpoint += `&end_date=${endDate}`;

    return fetch(`${this.baseUrl}${endpoint}`)
      .then(response => {
        if (!response.ok) throw new Error('Export failed');
        return response.blob();
      });
  }

  /**
   * Get historical trends
   */
  async getHistoricalTrends(bearingId, days = 7) {
    return this.request(`/bearings/${bearingId}/trends?days=${days}`);
  }

  /**
   * Get maintenance schedule
   */
  async getMaintenanceSchedule(bearingId = null) {
    const endpoint = bearingId
      ? `/maintenance/schedule?bearing_id=${bearingId}`
      : '/maintenance/schedule';
    return this.request(endpoint);
  }

  /**
   * Update maintenance schedule
   */
  async updateMaintenanceSchedule(bearingId, scheduleData) {
    return this.request(`/maintenance/schedule/${bearingId}`, {
      method: 'PUT',
      body: JSON.stringify(scheduleData),
    });
  }
}

// Create and export a singleton instance
export const api = new ApiService(API_BASE_URL);

// Export the class for testing purposes
export default ApiService;
