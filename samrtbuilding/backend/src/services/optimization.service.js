const { calculateOptimalSetpoint } = require('../utils/calculations');
const logger = require('../utils/logger');

class OptimizationService {
  async optimizeZoneSetpoints(zones) {
    try {
      return zones.map(zone => ({
        zoneId: zone.id,
        optimalSetpoint: calculateOptimalSetpoint({
          currentSetpoint: zone.setpoint,
          occupancy: zone.occupancy,
          outdoorTemp: 75,
          timeOfDay: new Date().getHours()
        })
      }));
    } catch (error) {
      logger.error('Optimization error:', error);
      return [];
    }
  }
}

module.exports = new OptimizationService();
