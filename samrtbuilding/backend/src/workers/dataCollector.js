const cron = require('node-cron');
const { EnergyReading, Equipment, Zone } = require('../models');
const logger = require('../utils/logger');
const { emit } = require('../config/websocket');

let job = null;

function start() {
  job = cron.schedule('*/5 * * * *', async () => {
    try {
      const equipment = await Equipment.findAll({ where: { isActive: true } });
      const readings = equipment.map(eq => ({
        timestamp: new Date(),
        buildingId: eq.buildingId,
        equipmentId: eq.id,
        powerKw: eq.isRunning ? 10 + Math.random() * 5 : 0
      }));
      await EnergyReading.bulkCreate(readings);
      logger.debug('Collected energy readings');
    } catch (error) {
      logger.error('Data collector error:', error);
    }
  });
  logger.info('Data collector started');
}

function stop() {
  if (job) job.stop();
  logger.info('Data collector stopped');
}

module.exports = { start, stop };
