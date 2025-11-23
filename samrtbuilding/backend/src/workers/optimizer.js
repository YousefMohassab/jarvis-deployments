const cron = require('node-cron');
const logger = require('../utils/logger');

let job = null;

function start() {
  job = cron.schedule('*/15 * * * *', async () => {
    try {
      logger.debug('Running optimization');
    } catch (error) {
      logger.error('Optimizer error:', error);
    }
  });
  logger.info('Optimizer started');
}

function stop() {
  if (job) job.stop();
  logger.info('Optimizer stopped');
}

module.exports = { start, stop };
