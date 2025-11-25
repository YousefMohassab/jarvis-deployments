const csvDataService = require('../services/csvDataService');
const logger = require('../utils/logger');

exports.getAllZones = async (req, res) => {
  try {
    const { buildingId } = req.query;
    const zones = await csvDataService.getAllZones({ buildingId });
    res.json({ success: true, data: zones });
  } catch (error) {
    logger.error('Get all zones error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.createZone = async (req, res) => {
  try {
    const { name, buildingId, type, floor, area, targetTemperature, occupancyLimit, description } = req.body;

    if (!name || !buildingId) {
      return res.status(400).json({ error: 'Name and buildingId are required' });
    }

    const zone = await csvDataService.createZone({
      name,
      buildingId: parseInt(buildingId),
      type: type || 'office',
      floor: floor || 1,
      area: area || 0,
      targetTemperature: targetTemperature || 22,
      occupancyLimit: occupancyLimit || 0,
      description: description || ''
    });

    res.status(201).json({ success: true, data: zone });
  } catch (error) {
    logger.error('Create zone error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.deleteZone = async (req, res) => {
  try {
    const success = await csvDataService.deleteZone(req.params.id);

    if (!success) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    res.json({ success: true, message: 'Zone deleted successfully' });
  } catch (error) {
    logger.error('Delete zone error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getZone = async (req, res) => {
  try {
    const zone = await csvDataService.getZoneById(req.params.id);

    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    // Get equipment for this zone
    const equipment = await csvDataService.getAllEquipment({ zoneId: zone.id });
    zone.equipment = equipment;

    res.json({ success: true, data: zone });
  } catch (error) {
    logger.error('Get zone error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.updateZone = async (req, res) => {
  try {
    const zone = await csvDataService.updateZone(req.params.id, req.body);

    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    res.json({ success: true, data: zone });
  } catch (error) {
    logger.error('Update zone error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.updateSetpoint = async (req, res) => {
  try {
    const { temperature } = req.body;

    const zone = await csvDataService.updateZone(req.params.id, {
      setpoint: temperature
    });

    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    res.json({ success: true, data: zone });
  } catch (error) {
    logger.error('Update setpoint error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getSchedule = async (req, res) => {
  try {
    const zone = await csvDataService.getZoneById(req.params.id);

    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    res.json({ success: true, data: zone.schedule || {} });
  } catch (error) {
    logger.error('Get schedule error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    const zone = await csvDataService.updateZone(req.params.id, {
      schedule: req.body
    });

    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    res.json({ success: true, data: zone });
  } catch (error) {
    logger.error('Update schedule error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};
