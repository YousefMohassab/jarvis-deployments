const { Alert } = require('../models');
const logger = require('../utils/logger');

exports.getAllAlerts = async (req, res) => {
  try {
    const alerts = await Alert.findAll({ limit: 100, order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getAlert = async (req, res) => {
  try {
    const alert = await Alert.findByPk(req.params.id);
    if (!alert) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.acknowledgeAlert = async (req, res) => {
  try {
    const alert = await Alert.findByPk(req.params.id);
    await alert.update({ status: 'acknowledged', acknowledgedBy: req.user.id, acknowledgedAt: new Date() });
    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.resolveAlert = async (req, res) => {
  try {
    const alert = await Alert.findByPk(req.params.id);
    await alert.update({ status: 'resolved', resolvedBy: req.user.id, resolvedAt: new Date(), resolution: req.body.resolution });
    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    res.json({ success: true, message: 'Settings updated' });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};
