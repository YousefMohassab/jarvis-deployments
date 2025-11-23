const { Equipment } = require('../models');
const logger = require('../utils/logger');

exports.getAllEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findAll({ where: { isActive: true } });
    res.json({ success: true, data: equipment });
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findByPk(req.params.id);
    if (!equipment) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, data: equipment });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.controlEquipment = async (req, res) => {
  try {
    const { action } = req.body;
    const equipment = await Equipment.findByPk(req.params.id);
    if (!equipment) return res.status(404).json({ error: 'Not found' });
    if (action === 'start') await equipment.update({ isRunning: true });
    else if (action === 'stop') await equipment.update({ isRunning: false });
    res.json({ success: true, data: equipment });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getMaintenanceHistory = async (req, res) => {
  try {
    const equipment = await Equipment.findByPk(req.params.id);
    res.json({ success: true, data: { lastMaintenance: equipment?.lastMaintenance } });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.updateMaintenance = async (req, res) => {
  try {
    const equipment = await Equipment.findByPk(req.params.id);
    await equipment.update({ lastMaintenance: new Date() });
    res.json({ success: true, data: equipment });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};
