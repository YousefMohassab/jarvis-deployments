const csvDataService = require('../services/csvDataService');
const logger = require('../utils/logger');
const { calculatePeakDemand, forecastEnergy } = require('../utils/calculations');

exports.getCurrentEnergy = async (req, res) => {
  try {
    const { buildingId } = req.query;

    const readings = await csvDataService.getCurrentEnergyReadings(buildingId, 5);

    const totalPower = readings.reduce((sum, r) => sum + r.powerKw, 0);
    const avgPower = readings.length > 0 ? totalPower / readings.length : 0;

    const result = {
      currentPower: Math.round(avgPower * 100) / 100,
      readings: readings.slice(0, 10),
      timestamp: new Date()
    };

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Get current energy error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getHistoricalEnergy = async (req, res) => {
  try {
    const { buildingId, startDate, endDate, interval = '15min' } = req.query;

    const readings = await csvDataService.getHistoricalEnergyReadings(
      buildingId ? parseInt(buildingId) : 1,
      startDate,
      endDate,
      1000
    );

    res.json({ success: true, data: readings });
  } catch (error) {
    logger.error('Get historical energy error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getEnergyByZones = async (req, res) => {
  try {
    const { buildingId } = req.query;

    const zones = await csvDataService.getEnergyReadingsByZones(
      buildingId ? parseInt(buildingId) : 1
    );

    res.json({ success: true, data: zones });
  } catch (error) {
    logger.error('Get energy by zones error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getPeakDemand = async (req, res) => {
  try {
    const { buildingId, date } = req.query;

    const peakData = csvDataService.calculatePeakDemand(
      buildingId ? parseInt(buildingId) : 1,
      date
    );

    res.json({ success: true, data: peakData });
  } catch (error) {
    logger.error('Get peak demand error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getForecast = async (req, res) => {
  try {
    const { buildingId, hours = 24 } = req.query;

    const historicalReadings = await csvDataService.getHistoricalEnergyReadings(
      buildingId ? parseInt(buildingId) : 1,
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      new Date()
    );

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
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const [todayReadings, yesterdayReadings] = await Promise.all([
      csvDataService.getEnergyReadings({
        buildingId: buildingId ? parseInt(buildingId) : 1,
        startDate: today
      }),
      csvDataService.getEnergyReadings({
        buildingId: buildingId ? parseInt(buildingId) : 1,
        startDate: yesterday,
        endDate: today
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
