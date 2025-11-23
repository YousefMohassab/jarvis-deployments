const cron = require('node-cron');
const logger = require('../utils/logger');

let job = null;

function start() {
  job = cron.schedule('* * * * *', async () => {
    try {
      logger.debug('Checking alerts');
    } catch (error) {
      logger.error('Alert monitor error:', error);
    }
  });
  logger.info('Alert monitor started');
}

function stop() {
  if (job) job.stop();
  logger.info('Alert monitor stopped');
}

module.exports = { start, stop };
