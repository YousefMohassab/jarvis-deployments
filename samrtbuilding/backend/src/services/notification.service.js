const logger = require('../utils/logger');

class NotificationService {
  async sendEmail(to, subject, body) {
    logger.info(\`Email sent to \${to}: \${subject}\`);
    return true;
  }

  async sendSMS(to, message) {
    logger.info(\`SMS sent to \${to}: \${message}\`);
    return true;
  }

  async sendPushNotification(userId, title, body) {
    logger.info(\`Push notification sent to user \${userId}\`);
    return true;
  }
}

module.exports = new NotificationService();
