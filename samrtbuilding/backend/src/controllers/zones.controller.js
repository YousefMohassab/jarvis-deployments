const { Zone, Building, Equipment, Sensor } = require('../models');
const logger = require('../utils/logger');
const { emit } = require('../config/websocket');

exports.getAllZones = async (req, res) => {
  try {
    const { buildingId } = req.query;
    const whereClause = buildingId ? { buildingId: parseInt(buildingId), isActive: true } : { isActive: true };
    const zones = await Zone.findAll({ where: whereClause, include: [{ model: Building, as: 'building' }] });
    res.json({ success: true, data: zones });
  } catch (error) {
    logger.error('Get all zones error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getZone = async (req, res) => {
  try {
    const zone = await Zone.findByPk(req.params.id, { include: [{ model: Building, as: 'building' }, { model: Equipment, as: 'equipment' }] });
    if (!zone) return res.status(404).json({ error: 'Zone not found' });
    res.json({ success: true, data: zone });
  } catch (error) {
    logger.error('Get zone error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.updateZone = async (req, res) => {
  try {
    const zone = await Zone.findByPk(req.params.id);
    if (!zone) return res.status(404).json({ error: 'Zone not found' });
    await zone.update(req.body);
    emit.zoneUpdate(zone.id, zone);
    res.json({ success: true, data: zone });
  } catch (error) {
    logger.error('Update zone error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.updateSetpoint = async (req, res) => {
  try {
    const { temperature } = req.body;
    const zone = await Zone.findByPk(req.params.id);
    if (!zone) return res.status(404).json({ error: 'Zone not found' });
    await zone.update({ setpoint: temperature });
    emit.zoneUpdate(zone.id, { id: zone.id, setpoint: temperature });
    res.json({ success: true, data: zone });
  } catch (error) {
    logger.error('Update setpoint error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getSchedule = async (req, res) => {
  try {
    const zone = await Zone.findByPk(req.params.id);
    if (!zone) return res.status(404).json({ error: 'Zone not found' });
    res.json({ success: true, data: zone.schedule });
  } catch (error) {
    logger.error('Get schedule error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    const zone = await Zone.findByPk(req.params.id);
    if (!zone) return res.status(404).json({ error: 'Zone not found' });
    await zone.update({ schedule: req.body });
    res.json({ success: true, data: zone });
  } catch (error) {
    logger.error('Update schedule error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};
