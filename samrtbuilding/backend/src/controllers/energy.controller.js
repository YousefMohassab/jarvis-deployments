const { EnergyReading, Building, Zone, Equipment } = require('../models');
const { cache } = require('../config/redis');
const logger = require('../utils/logger');
const { calculatePeakDemand, forecastEnergy } = require('../utils/calculations');
const { Op } = require('sequelize');

exports.getCurrentEnergy = async (req, res) => {
  try {
    const { buildingId } = req.query;

    const cacheKey = `energy:current:${buildingId || 'all'}`;
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
