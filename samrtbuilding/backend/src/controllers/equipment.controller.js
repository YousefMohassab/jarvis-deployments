const csvDataService = require('../services/csvDataService');
const logger = require('../utils/logger');

exports.getAllEquipment = async (req, res) => {
  try {
    const { zoneId, buildingId } = req.query;
    const equipment = await csvDataService.getAllEquipment({ zoneId, buildingId });
    res.json({ success: true, data: equipment });
  } catch (error) {
    logger.error('Get all equipment error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getEquipment = async (req, res) => {
  try {
    const equipment = await csvDataService.getEquipmentById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    // Get sensors for this equipment
    const sensors = await csvDataService.getAllSensors({ equipmentId: equipment.id });
    equipment.sensors = sensors;

    res.json({ success: true, data: equipment });
  } catch (error) {
    logger.error('Get equipment error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.controlEquipment = async (req, res) => {
  try {
    const { action } = req.body;
    const equipment = await csvDataService.getEquipmentById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    res.json({ success: true, message: `Equipment ${action} command sent`, data: equipment });
  } catch (error) {
    logger.error('Control equipment error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getMaintenanceHistory = async (req, res) => {
  try {
    const equipment = await csvDataService.getEquipmentById(req.params.id);

    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    res.json({
      success: true,
      data: {
        lastMaintenance: equipment.lastMaintenance,
        maintenanceInterval: equipment.maintenanceInterval,
        installDate: equipment.installDate
      }
    });
  } catch (error) {
    logger.error('Get maintenance history error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.updateMaintenance = async (req, res) => {
  try {
    res.json({ success: true, message: 'Maintenance record updated' });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};
