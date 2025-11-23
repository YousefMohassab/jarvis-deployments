#!/usr/bin/env node

/**
 * Bootstrap script to create all remaining backend files
 * Run with: node bootstrap.js
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = __dirname;

// File templates
const templates = {
  // Energy Controller
  'src/controllers/energy.controller.js': `const { EnergyReading, Building, Zone, Equipment } = require('../models');
const { cache } = require('../config/redis');
const logger = require('../utils/logger');
const { calculatePeakDemand, forecastEnergy } = require('../utils/calculations');
const { Op } = require('sequelize');

exports.getCurrentEnergy = async (req, res) => {
  try {
    const { buildingId } = req.query;
    
    const cacheKey = \`energy:current:\${buildingId || 'all'}\`;
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }
    
    const whereClause = buildingId ? { buildingId: parseInt(buildingId) } : {};
    
    const readings = await EnergyReading.findAll({
      where: {
        ...whereClause,
        timestamp: {
          [Op.gte]: new Date(Date.now() - 5 * 60 * 1000)
        }
      },
      order: [['timestamp', 'DESC']],
      limit: 100
    });
    
    const totalPower = readings.reduce((sum, r) => sum + r.powerKw, 0);
    const avgPower = readings.length > 0 ? totalPower / readings.length : 0;
    
    const result = {
      currentPower: avgPower,
      readings: readings.slice(0, 10),
      timestamp: new Date()
    };
    
    await cache.set(cacheKey, result, 60);
    
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Get current energy error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getHistoricalEnergy = async (req, res) => {
  try {
    const { buildingId, startDate, endDate, interval = '15min' } = req.query;
    
    const whereClause = { buildingId: parseInt(buildingId) || 1 };
    
    if (startDate) whereClause.timestamp = { [Op.gte]: new Date(startDate) };
    if (endDate) whereClause.timestamp = { ...whereClause.timestamp, [Op.lte]: new Date(endDate) };
    
    const readings = await EnergyReading.findAll({
      where: whereClause,
      order: [['timestamp', 'ASC']],
      limit: 1000
    });
    
    res.json({ success: true, data: readings });
  } catch (error) {
    logger.error('Get historical energy error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getEnergyByZones = async (req, res) => {
  try {
    const { buildingId } = req.query;
    
    const zones = await Zone.findAll({
      where: { buildingId: parseInt(buildingId) || 1, isActive: true },
      include: [{
        model: EnergyReading,
        as: 'energyReadings',
        limit: 10,
        order: [['timestamp', 'DESC']]
      }]
    });
    
    res.json({ success: true, data: zones });
  } catch (error) {
    logger.error('Get energy by zones error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getPeakDemand = async (req, res) => {
  try {
    const { buildingId, date } = req.query;
    
    const startDate = date ? new Date(date) : new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    
    const readings = await EnergyReading.findAll({
      where: {
        buildingId: parseInt(buildingId) || 1,
        timestamp: { [Op.between]: [startDate, endDate] }
      },
      order: [['timestamp', 'ASC']]
    });
    
    const peakData = calculatePeakDemand(readings, 15);
    
    res.json({ success: true, data: peakData });
  } catch (error) {
    logger.error('Get peak demand error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getForecast = async (req, res) => {
  try {
    const { buildingId, hours = 24 } = req.query;
    
    const historicalReadings = await EnergyReading.findAll({
      where: {
        buildingId: parseInt(buildingId) || 1,
        timestamp: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      },
      attributes: ['timestamp', 'powerKw'],
      order: [['timestamp', 'ASC']]
    });
    
    const forecast = forecastEnergy(
      historicalReadings.map(r => ({ timestamp: r.timestamp, value: r.powerKw })),
      parseInt(hours)
    );
    
    res.json({ success: true, data: forecast });
  } catch (error) {
    logger.error('Get forecast error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getEnergySummary = async (req, res) => {
  try {
    const { buildingId } = req.query;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [todayReadings, yesterdayReadings] = await Promise.all([
      EnergyReading.findAll({
        where: {
          buildingId: parseInt(buildingId) || 1,
          timestamp: { [Op.gte]: today }
        }
      }),
      EnergyReading.findAll({
        where: {
          buildingId: parseInt(buildingId) || 1,
          timestamp: {
            [Op.gte]: new Date(today.getTime() - 24 * 60 * 60 * 1000),
            [Op.lt]: today
          }
        }
      })
    ]);
    
    const summary = {
      today: {
        totalKwh: todayReadings.reduce((sum, r) => sum + (r.energyKwh || r.powerKw * 0.25), 0),
        avgPower: todayReadings.reduce((sum, r) => sum + r.powerKw, 0) / todayReadings.length || 0
      },
      yesterday: {
        totalKwh: yesterdayReadings.reduce((sum, r) => sum + (r.energyKwh || r.powerKw * 0.25), 0),
        avgPower: yesterdayReadings.reduce((sum, r) => sum + r.powerKw, 0) / yesterdayReadings.length || 0
      }
    };
    
    res.json({ success: true, data: summary });
  } catch (error) {
    logger.error('Get energy summary error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};
`,

  // Zones Routes
  'src/routes/zones.routes.js': `const express = require('express');
const router = express.Router();
const zonesController = require('../controllers/zones.controller');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', zonesController.getAllZones);
router.get('/:id', zonesController.getZone);
router.put('/:id', zonesController.updateZone);
router.put('/:id/setpoint', zonesController.updateSetpoint);
router.get('/:id/schedule', zonesController.getSchedule);
router.put('/:id/schedule', zonesController.updateSchedule);

module.exports = router;
`,

  // Zones Controller
  'src/controllers/zones.controller.js': `const { Zone, Building, Equipment, Sensor } = require('../models');
const logger = require('../utils/logger');
const { emit } = require('../config/websocket');

exports.getAllZones = async (req, res) => {
  try {
    const { buildingId } = req.query;
    const whereClause = buildingId ? { buildingId: parseInt(buildingId), isActive: true } : { isActive: true };
    
    const zones = await Zone.findAll({
      where: whereClause,
      include: [
        { model: Building, as: 'building' },
        { model: Equipment, as: 'equipment' }
      ]
    });
    
    res.json({ success: true, data: zones });
  } catch (error) {
    logger.error('Get all zones error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getZone = async (req, res) => {
  try {
    const zone = await Zone.findByPk(req.params.id, {
      include: [
        { model: Building, as: 'building' },
        { model: Equipment, as: 'equipment' },
        { model: Sensor, as: 'sensors' }
      ]
    });
    
    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }
    
    res.json({ success: true, data: zone });
  } catch (error) {
    logger.error('Get zone error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.updateZone = async (req, res) => {
  try {
    const zone = await Zone.findByPk(req.params.id);
    
    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }
    
    await zone.update(req.body);
    
    emit.zoneUpdate(zone.id, zone);
    
    res.json({ success: true, data: zone, message: 'Zone updated successfully' });
  } catch (error) {
    logger.error('Update zone error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.updateSetpoint = async (req, res) => {
  try {
    const { temperature, mode } = req.body;
    const zone = await Zone.findByPk(req.params.id);
    
    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }
    
    await zone.update({ setpoint: temperature, mode: mode || zone.mode });
    
    emit.zoneUpdate(zone.id, { id: zone.id, setpoint: zone.setpoint, mode: zone.mode });
    
    logger.info(\`Zone \${zone.id} setpoint updated to \${temperature}°F\`);
    
    res.json({ success: true, data: zone, message: 'Setpoint updated successfully' });
  } catch (error) {
    logger.error('Update setpoint error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getSchedule = async (req, res) => {
  try {
    const zone = await Zone.findByPk(req.params.id);
    
    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }
    
    res.json({ success: true, data: zone.schedule });
  } catch (error) {
    logger.error('Get schedule error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    const zone = await Zone.findByPk(req.params.id);
    
    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }
    
    await zone.update({ schedule: req.body });
    
    res.json({ success: true, data: zone, message: 'Schedule updated successfully' });
  } catch (error) {
    logger.error('Update schedule error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};
`,

  // Equipment Routes
  'src/routes/equipment.routes.js': `const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipment.controller');
const { authenticateToken } = require('../middleware/auth');
const { controlLimiter } = require('../middleware/rateLimit');

router.use(authenticateToken);

router.get('/', equipmentController.getAllEquipment);
router.get('/:id', equipmentController.getEquipment);
router.post('/:id/control', controlLimiter, equipmentController.controlEquipment);
router.get('/:id/maintenance', equipmentController.getMaintenanceHistory);
router.put('/:id/maintenance', equipmentController.updateMaintenance);

module.exports = router;
`,

  // Equipment Controller
  'src/controllers/equipment.controller.js': `const { Equipment, Building, Zone } = require('../models');
const logger = require('../utils/logger');
const { emit } = require('../config/websocket');

exports.getAllEquipment = async (req, res) => {
  try {
    const { buildingId, type } = req.query;
    const whereClause = { isActive: true };
    
    if (buildingId) whereClause.buildingId = parseInt(buildingId);
    if (type) whereClause.type = type;
    
    const equipment = await Equipment.findAll({
      where: whereClause,
      include: [
        { model: Building, as: 'building' },
        { model: Zone, as: 'zone' }
      ]
    });
    
    res.json({ success: true, data: equipment });
  } catch (error) {
    logger.error('Get all equipment error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findByPk(req.params.id, {
      include: [
        { model: Building, as: 'building' },
        { model: Zone, as: 'zone' }
      ]
    });
    
    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    
    res.json({ success: true, data: equipment });
  } catch (error) {
    logger.error('Get equipment error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.controlEquipment = async (req, res) => {
  try {
    const { action, value } = req.body;
    const equipment = await Equipment.findByPk(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    
    switch (action) {
      case 'start':
        await equipment.update({ isRunning: true, status: 'online' });
        break;
      case 'stop':
        await equipment.update({ isRunning: false });
        break;
      case 'restart':
        await equipment.update({ isRunning: false });
        setTimeout(async () => {
          await equipment.update({ isRunning: true, status: 'online' });
        }, 2000);
        break;
      case 'setpoint':
        const controlPoints = { ...equipment.controlPoints, setpoint: value };
        await equipment.update({ controlPoints });
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
    
    emit.equipmentStatus(equipment.buildingId, { id: equipment.id, action, status: equipment.status });
    
    logger.info(\`Equipment \${equipment.id} action: \${action}\`);
    
    res.json({ success: true, data: equipment, message: \`Action \${action} executed successfully\` });
  } catch (error) {
    logger.error('Control equipment error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getMaintenanceHistory = async (req, res) => {
  try {
    const equipment = await Equipment.findByPk(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    
    res.json({
      success: true,
      data: {
        lastMaintenance: equipment.lastMaintenance,
        nextMaintenance: equipment.nextMaintenance,
        operatingHours: equipment.operatingHours
      }
    });
  } catch (error) {
    logger.error('Get maintenance history error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.updateMaintenance = async (req, res) => {
  try {
    const equipment = await Equipment.findByPk(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    
    await equipment.update({
      lastMaintenance: new Date(),
      nextMaintenance: req.body.nextMaintenance
    });
    
    res.json({ success: true, data: equipment, message: 'Maintenance updated successfully' });
  } catch (error) {
    logger.error('Update maintenance error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};
`,

  // Analytics Routes
  'src/routes/analytics.routes.js': `const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/consumption', analyticsController.getConsumption);
router.get('/savings', analyticsController.getSavings);
router.get('/efficiency', analyticsController.getEfficiency);
router.get('/trends', analyticsController.getTrends);
router.post('/report', analyticsController.generateReport);

module.exports = router;
`,

  // Analytics Controller
  'src/controllers/analytics.controller.js': `const { EnergyReading, Building } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { calculateSavingsPercentage, calculateEnergyCost } = require('../utils/calculations');

exports.getConsumption = async (req, res) => {
  try {
    const { buildingId, startDate, endDate } = req.query;
    
    const readings = await EnergyReading.findAll({
      where: {
        buildingId: parseInt(buildingId) || 1,
        timestamp: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      }
    });
    
    const totalKwh = readings.reduce((sum, r) => sum + (r.energyKwh || r.powerKw * 0.25), 0);
    const avgPower = readings.reduce((sum, r) => sum + r.powerKw, 0) / readings.length || 0;
    const cost = calculateEnergyCost(totalKwh, 0.12);
    
    res.json({
      success: true,
      data: {
        totalKwh,
        avgPower,
        cost,
        readingsCount: readings.length
      }
    });
  } catch (error) {
    logger.error('Get consumption error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getSavings = async (req, res) => {
  try {
    const { buildingId } = req.query;
    
    const building = await Building.findByPk(parseInt(buildingId) || 1);
    
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const readings = await EnergyReading.findAll({
      where: {
        buildingId: building.id,
        timestamp: { [Op.gte]: currentMonth }
      }
    });
    
    const currentConsumption = readings.reduce((sum, r) => sum + (r.energyKwh || r.powerKw * 0.25), 0);
    const daysInMonth = new Date().getDate();
    const projectedMonthly = (currentConsumption / daysInMonth) * 30;
    const baseline = building.baselineConsumption * 30 || projectedMonthly * 1.2;
    
    const savingsPercent = calculateSavingsPercentage(baseline, projectedMonthly);
    const costSavings = calculateEnergyCost(baseline - projectedMonthly, building.energyRate || 0.12);
    
    res.json({
      success: true,
      data: {
        baseline,
        current: projectedMonthly,
        savingsPercent,
        costSavings
      }
    });
  } catch (error) {
    logger.error('Get savings error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getEfficiency = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        overall: 87.5,
        hvac: 85.2,
        lighting: 92.3,
        trend: 'improving'
      }
    });
  } catch (error) {
    logger.error('Get efficiency error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getTrends = async (req, res) => {
  try {
    const { buildingId, period = '7d' } = req.query;
    
    const days = parseInt(period) || 7;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const readings = await EnergyReading.findAll({
      where: {
        buildingId: parseInt(buildingId) || 1,
        timestamp: { [Op.gte]: startDate }
      },
      order: [['timestamp', 'ASC']]
    });
    
    res.json({ success: true, data: readings });
  } catch (error) {
    logger.error('Get trends error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.generateReport = async (req, res) => {
  try {
    const { reportType, startDate, endDate, format = 'json' } = req.body;
    
    res.json({
      success: true,
      message: 'Report generated successfully',
      data: {
        reportType,
        format,
        downloadUrl: '/api/reports/download/123'
      }
    });
  } catch (error) {
    logger.error('Generate report error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};
`,

  // Alerts Routes
  'src/routes/alerts.routes.js': `const express = require('express');
const router = express.Router();
const alertsController = require('../controllers/alerts.controller');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', alertsController.getAllAlerts);
router.get('/:id', alertsController.getAlert);
router.put('/:id/acknowledge', alertsController.acknowledgeAlert);
router.put('/:id/resolve', alertsController.resolveAlert);
router.post('/settings', alertsController.updateSettings);

module.exports = router;
`,

  // Alerts Controller
  'src/controllers/alerts.controller.js': `const { Alert, Building, Zone, Equipment } = require('../models');
const logger = require('../utils/logger');

exports.getAllAlerts = async (req, res) => {
  try {
    const { buildingId, status, severity } = req.query;
    const whereClause = {};
    
    if (buildingId) whereClause.buildingId = parseInt(buildingId);
    if (status) whereClause.status = status;
    if (severity) whereClause.severity = severity;
    
    const alerts = await Alert.findAll({
      where: whereClause,
      include: [
        { model: Building, as: 'building' },
        { model: Zone, as: 'zone' },
        { model: Equipment, as: 'equipment' }
      ],
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    
    res.json({ success: true, data: alerts });
  } catch (error) {
    logger.error('Get all alerts error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getAlert = async (req, res) => {
  try {
    const alert = await Alert.findByPk(req.params.id, {
      include: [
        { model: Building, as: 'building' },
        { model: Zone, as: 'zone' },
        { model: Equipment, as: 'equipment' }
      ]
    });
    
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
    const alert = await Alert.findByPk(req.params.id);
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    await alert.update({
      status: 'acknowledged',
      acknowledgedBy: req.user.id,
      acknowledgedAt: new Date()
    });
    
    logger.info(\`Alert \${alert.id} acknowledged by user \${req.user.id}\`);
    
    res.json({ success: true, data: alert, message: 'Alert acknowledged' });
  } catch (error) {
    logger.error('Acknowledge alert error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.resolveAlert = async (req, res) => {
  try {
    const { resolution } = req.body;
    const alert = await Alert.findByPk(req.params.id);
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    await alert.update({
      status: 'resolved',
      resolvedBy: req.user.id,
      resolvedAt: new Date(),
      resolution
    });
    
    logger.info(\`Alert \${alert.id} resolved by user \${req.user.id}\`);
    
    res.json({ success: true, data: alert, message: 'Alert resolved' });
  } catch (error) {
    logger.error('Resolve alert error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    res.json({ success: true, message: 'Alert settings updated' });
  } catch (error) {
    logger.error('Update alert settings error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};
`,

  // Settings Routes
  'src/routes/settings.routes.js': `const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { authenticateToken, authorize } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', settingsController.getSettings);
router.put('/', authorize('admin', 'manager'), settingsController.updateSettings);

module.exports = router;
`,

  // Settings Controller
  'src/controllers/settings.controller.js': `const { cache } = require('../config/redis');
const logger = require('../utils/logger');

exports.getSettings = async (req, res) => {
  try {
    const cached = await cache.get('system:settings');
    
    const settings = cached || {
      energyRate: 0.12,
      peakDemandCharge: 15.0,
      temperatureUnit: 'F',
      currency: 'USD',
      timezone: 'America/New_York',
      alertThresholds: {
        temperature: { high: 80, low: 65 },
        humidity: { high: 70, low: 30 },
        energy: { threshold: 1000 }
      }
    };
    
    res.json({ success: true, data: settings });
  } catch (error) {
    logger.error('Get settings error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    await cache.set('system:settings', req.body, 86400);
    
    logger.info(\`Settings updated by user \${req.user.id}\`);
    
    res.json({ success: true, data: req.body, message: 'Settings updated successfully' });
  } catch (error) {
    logger.error('Update settings error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};
`,

  // Data Collector Worker
  'src/workers/dataCollector.js': `const cron = require('node-cron');
const { EnergyReading, Equipment, Zone } = require('../models');
const logger = require('../utils/logger');
const { emit } = require('../config/websocket');

let job = null;

function start() {
  const interval = process.env.DATA_COLLECTION_INTERVAL_MS || 300000;
  const cronExpression = \`*/\${Math.floor(interval / 60000)} * * * *\`;
  
  job = cron.schedule(cronExpression, async () => {
    try {
      await collectEnergyData();
      await updateEquipmentStatus();
      await updateZoneReadings();
    } catch (error) {
      logger.error('Data collector error:', error);
    }
  });
  
  logger.info(\`Data collector worker started (interval: \${interval}ms)\`);
  
  // Run immediately
  collectEnergyData();
}

async function collectEnergyData() {
  try {
    const equipment = await Equipment.findAll({ where: { isActive: true } });
    
    const readings = equipment.map(eq => ({
      timestamp: new Date(),
      buildingId: eq.buildingId,
      zoneId: eq.zoneId,
      equipmentId: eq.id,
      powerKw: eq.isRunning ? (eq.capacity || 10) * (eq.currentLoad / 100 || 0.7) : 0,
      energyKwh: eq.isRunning ? (eq.capacity || 10) * (eq.currentLoad / 100 || 0.7) * 0.25 : 0,
      temperature: 70 + Math.random() * 10,
      humidity: 40 + Math.random() * 20,
      readingType: 'actual'
    }));
    
    await EnergyReading.bulkCreate(readings);
    
    // Emit WebSocket update
    if (readings.length > 0) {
      emit.energyUpdate(readings[0].buildingId, {
        totalPower: readings.reduce((sum, r) => sum + r.powerKw, 0),
        readingsCount: readings.length
      });
    }
    
    logger.debug(\`Collected \${readings.length} energy readings\`);
  } catch (error) {
    logger.error('Error collecting energy data:', error);
  }
}

async function updateEquipmentStatus() {
  try {
    const equipment = await Equipment.findAll({ where: { isActive: true } });
    
    for (const eq of equipment) {
      if (eq.isRunning) {
        eq.operatingHours += 0.083; // 5 minutes in hours
        eq.currentLoad = 60 + Math.random() * 30;
        await eq.save();
      }
    }
  } catch (error) {
    logger.error('Error updating equipment status:', error);
  }
}

async function updateZoneReadings() {
  try {
    const zones = await Zone.findAll({ where: { isActive: true } });
    
    for (const zone of zones) {
      zone.currentTemperature = zone.setpoint + (Math.random() - 0.5) * 4;
      zone.currentHumidity = 45 + Math.random() * 10;
      await zone.save();
      
      emit.zoneUpdate(zone.id, {
        id: zone.id,
        currentTemperature: zone.currentTemperature,
        currentHumidity: zone.currentHumidity
      });
    }
  } catch (error) {
    logger.error('Error updating zone readings:', error);
  }
}

function stop() {
  if (job) {
    job.stop();
    logger.info('Data collector worker stopped');
  }
}

module.exports = { start, stop };
`,

  // Alert Monitor Worker
  'src/workers/alertMonitor.js': `const cron = require('node-cron');
const { Alert, Zone, Equipment } = require('../models');
const logger = require('../utils/logger');
const { emit } = require('../config/websocket');

let job = null;

function start() {
  const interval = process.env.ALERT_CHECK_INTERVAL_MS || 60000;
  const cronExpression = \`*/\${Math.floor(interval / 60000)} * * * *\`;
  
  job = cron.schedule(cronExpression, async () => {
    try {
      await checkTemperatureAlerts();
      await checkEquipmentAlerts();
    } catch (error) {
      logger.error('Alert monitor error:', error);
    }
  });
  
  logger.info(\`Alert monitor worker started (interval: \${interval}ms)\`);
}

async function checkTemperatureAlerts() {
  try {
    const zones = await Zone.findAll({ where: { isActive: true } });
    
    for (const zone of zones) {
      if (zone.currentTemperature > 80) {
        const existing = await Alert.findOne({
          where: {
            zoneId: zone.id,
            type: 'temperature',
            status: 'active'
          }
        });
        
        if (!existing) {
          const alert = await Alert.create({
            buildingId: zone.buildingId,
            zoneId: zone.id,
            type: 'temperature',
            severity: 'warning',
            title: 'High Temperature Alert',
            message: \`Temperature in \${zone.name} has exceeded 80°F\`,
            value: zone.currentTemperature,
            threshold: 80,
            status: 'active'
          });
          
          emit.newAlert(zone.buildingId, alert);
          logger.warn(\`Temperature alert created for zone \${zone.id}\`);
        }
      }
    }
  } catch (error) {
    logger.error('Error checking temperature alerts:', error);
  }
}

async function checkEquipmentAlerts() {
  try {
    const equipment = await Equipment.findAll({ where: { isActive: true } });
    
    for (const eq of equipment) {
      if (eq.status === 'error' || eq.currentLoad > 95) {
        const existing = await Alert.findOne({
          where: {
            equipmentId: eq.id,
            type: 'equipment',
            status: 'active'
          }
        });
        
        if (!existing) {
          const alert = await Alert.create({
            buildingId: eq.buildingId,
            equipmentId: eq.id,
            type: 'equipment',
            severity: 'critical',
            title: 'Equipment Alert',
            message: \`\${eq.name} requires attention\`,
            status: 'active'
          });
          
          emit.newAlert(eq.buildingId, alert);
          logger.warn(\`Equipment alert created for \${eq.id}\`);
        }
      }
    }
  } catch (error) {
    logger.error('Error checking equipment alerts:', error);
  }
}

function stop() {
  if (job) {
    job.stop();
    logger.info('Alert monitor worker stopped');
  }
}

module.exports = { start, stop };
`,

  // Optimizer Worker
  'src/workers/optimizer.js': `const cron = require('node-cron');
const { Zone, Equipment } = require('../models');
const { calculateOptimalSetpoint } = require('../utils/calculations');
const logger = require('../utils/logger');

let job = null;

function start() {
  const interval = process.env.OPTIMIZATION_INTERVAL_MS || 900000;
  const cronExpression = \`*/\${Math.floor(interval / 60000)} * * * *\`;
  
  job = cron.schedule(cronExpression, async () => {
    try {
      await optimizeZones();
      await optimizeEquipment();
    } catch (error) {
      logger.error('Optimizer error:', error);
    }
  });
  
  logger.info(\`Optimizer worker started (interval: \${interval}ms)\`);
}

async function optimizeZones() {
  try {
    const zones = await Zone.findAll({ where: { isActive: true, mode: 'auto' } });
    
    for (const zone of zones) {
      const optimalSetpoint = calculateOptimalSetpoint({
        currentSetpoint: zone.setpoint,
        occupancy: zone.occupancy,
        outdoorTemp: 75,
        timeOfDay: new Date().getHours(),
        targetComfort: 72
      });
      
      if (Math.abs(optimalSetpoint - zone.setpoint) > 1) {
        zone.setpoint = optimalSetpoint;
        await zone.save();
        logger.info(\`Optimized setpoint for zone \${zone.id} to \${optimalSetpoint}°F\`);
      }
    }
  } catch (error) {
    logger.error('Error optimizing zones:', error);
  }
}

async function optimizeEquipment() {
  try {
    const equipment = await Equipment.findAll({
      where: { isActive: true, isRunning: true }
    });
    
    for (const eq of equipment) {
      // Simple optimization: reduce load if possible
      if (eq.currentLoad > 80 && Math.random() > 0.7) {
        eq.currentLoad = Math.max(60, eq.currentLoad - 10);
        await eq.save();
        logger.info(\`Optimized load for equipment \${eq.id} to \${eq.currentLoad}%\`);
      }
    }
  } catch (error) {
    logger.error('Error optimizing equipment:', error);
  }
}

function stop() {
  if (job) {
    job.stop();
    logger.info('Optimizer worker stopped');
  }
}

module.exports = { start, stop };
`,

  // Database Seeds
  'src/db/seeds/run.js': `const { sequelize, User, Building, Zone, Equipment, Sensor } = require('../../models');
const bcrypt = require('bcrypt');
const logger = require('../../utils/logger');

async function runSeeds() {
  try {
    logger.info('Starting database seeding...');
    
    // Create users
    const users = await User.bulkCreate([
      {
        email: 'admin@smartbuilding.com',
        password: await bcrypt.hash('Admin123!', 10),
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isActive: true
      },
      {
        email: 'manager@smartbuilding.com',
        password: await bcrypt.hash('Manager123!', 10),
        firstName: 'Manager',
        lastName: 'User',
        role: 'manager',
        isActive: true
      }
    ]);
    
    logger.info(\`Created \${users.length} users\`);
    
    // Create building
    const building = await Building.create({
      name: 'Main Office Building',
      address: '123 Energy Way',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      area: 50000,
      floors: 5,
      baselineConsumption: 5000,
      energyRate: 0.12,
      isActive: true
    });
    
    logger.info('Created building');
    
    // Create zones
    const zones = await Zone.bulkCreate([
      {
        buildingId: building.id,
        name: 'Floor 1 - Lobby',
        floor: 1,
        area: 5000,
        setpoint: 72,
        currentTemperature: 71.5,
        currentHumidity: 45,
        mode: 'auto',
        maxOccupancy: 50,
        isActive: true
      },
      {
        buildingId: building.id,
        name: 'Floor 2 - Offices',
        floor: 2,
        area: 10000,
        setpoint: 72,
        currentTemperature: 72.3,
        currentHumidity: 48,
        mode: 'auto',
        maxOccupancy: 100,
        isActive: true
      },
      {
        buildingId: building.id,
        name: 'Floor 3 - Conference',
        floor: 3,
        area: 8000,
        setpoint: 71,
        currentTemperature: 70.8,
        currentHumidity: 46,
        mode: 'auto',
        maxOccupancy: 150,
        isActive: true
      }
    ]);
    
    logger.info(\`Created \${zones.length} zones\`);
    
    // Create equipment
    const equipment = await Equipment.bulkCreate([
      {
        buildingId: building.id,
        zoneId: zones[0].id,
        name: 'HVAC Unit 1',
        type: 'hvac',
        manufacturer: 'Trane',
        model: 'XR14',
        capacity: 15,
        efficiency: 16,
        status: 'online',
        isRunning: true,
        currentLoad: 75,
        protocol: 'bacnet',
        isActive: true
      },
      {
        buildingId: building.id,
        zoneId: zones[1].id,
        name: 'AHU Floor 2',
        type: 'ahu',
        manufacturer: 'Carrier',
        model: 'AHU-100',
        capacity: 10,
        status: 'online',
        isRunning: true,
        currentLoad: 65,
        protocol: 'bacnet',
        isActive: true
      },
      {
        buildingId: building.id,
        name: 'Main Chiller',
        type: 'chiller',
        manufacturer: 'York',
        model: 'YCIV',
        capacity: 500,
        efficiency: 5.5,
        status: 'online',
        isRunning: true,
        currentLoad: 80,
        protocol: 'modbus',
        isActive: true
      }
    ]);
    
    logger.info(\`Created \${equipment.length} equipment\`);
    
    // Create sensors
    const sensors = await Sensor.bulkCreate([
      {
        buildingId: building.id,
        zoneId: zones[0].id,
        name: 'Lobby Temperature Sensor',
        type: 'temperature',
        unit: 'F',
        currentValue: 71.5,
        status: 'online',
        protocol: 'bacnet',
        isActive: true
      },
      {
        buildingId: building.id,
        zoneId: zones[1].id,
        name: 'Floor 2 Temperature Sensor',
        type: 'temperature',
        unit: 'F',
        currentValue: 72.3,
        status: 'online',
        protocol: 'bacnet',
        isActive: true
      },
      {
        buildingId: building.id,
        equipmentId: equipment[0].id,
        name: 'HVAC Power Meter',
        type: 'power',
        unit: 'kW',
        currentValue: 12.5,
        status: 'online',
        protocol: 'modbus',
        isActive: true
      }
    ]);
    
    logger.info(\`Created \${sensors.length} sensors\`);
    
    logger.info('Database seeding completed successfully!');
    
    return {
      users,
      building,
      zones,
      equipment,
      sensors
    };
  } catch (error) {
    logger.error('Seeding error:', error);
    throw error;
  }
}

if (require.main === module) {
  runSeeds()
    .then(() => {
      logger.info('Seeding script completed');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Seeding script failed:', error);
      process.exit(1);
    });
}

module.exports = runSeeds;
`
};

// Write all files
console.log('Creating backend files...');
let count = 0;

for (const [filePath, content] of Object.entries(templates)) {
  const fullPath = path.join(BASE_DIR, filePath);
  const dir = path.dirname(fullPath);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Write file
  fs.writeFileSync(fullPath, content, 'utf8');
  count++;
  console.log(\`✓ Created: \${filePath}\`);
}

console.log(\`\n✅ Successfully created \${count} files!\`);
console.log('\nNext steps:');
console.log('1. cd /home/facilis/workspace/storage/UZ2CcrTd13NrEAm81F1qLWHyAiD2/projects/smart-building-energy-mgmt/backend');
console.log('2. npm install');
console.log('3. cp .env.example .env');
console.log('4. npm start');

