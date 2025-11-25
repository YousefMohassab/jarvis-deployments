const csvDataService = require('../services/csvDataService');
const logger = require('../utils/logger');

exports.getAllAlerts = async (req, res) => {
  try {
    const { status, severity, buildingId } = req.query;
    const alerts = await csvDataService.getAllAlerts({ status, severity, buildingId });
    res.json({ success: true, data: alerts.slice(0, 100) });
  } catch (error) {
    logger.error('Get all alerts error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getAlert = async (req, res) => {
  try {
    const alert = await csvDataService.getAlertById(req.params.id);

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ success: true, data: alert });
  } catch (error) {
    logger.error('Get alert error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.acknowledgeAlert = async (req, res) => {
  try {
    const alert = await csvDataService.acknowledgeAlert(req.params.id, 'system_user');

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ success: true, data: alert });
  } catch (error) {
    logger.error('Acknowledge alert error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.resolveAlert = async (req, res) => {
  try {
    const alert = await csvDataService.resolveAlert(req.params.id);

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ success: true, data: alert });
  } catch (error) {
    logger.error('Resolve alert error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    res.json({ success: true, message: 'Alert settings updated' });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};
