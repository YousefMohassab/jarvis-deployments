const { publish, subscribe } = require('../config/mqtt');
const logger = require('../utils/logger');

class MQTTService {
  async publishEnergyData(topic, data) {
    try {
      await publish(topic, data);
    } catch (error) {
      logger.error('MQTT publish error:', error);
    }
  }

  subscribeToSensors(callback) {
    return subscribe('sensors/+/+', callback);
  }
}

module.exports = new MQTTService();
