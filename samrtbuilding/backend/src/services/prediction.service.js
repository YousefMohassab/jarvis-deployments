const { forecastEnergy } = require('../utils/calculations');
const logger = require('../utils/logger');

class PredictionService {
  async predictEnergyConsumption(historicalData, hoursAhead = 24) {
    try {
      return forecastEnergy(historicalData, hoursAhead);
    } catch (error) {
      logger.error('Prediction error:', error);
      return [];
    }
  }
}

module.exports = new PredictionService();
