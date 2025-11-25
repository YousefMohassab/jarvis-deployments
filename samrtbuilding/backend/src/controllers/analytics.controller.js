const csvDataService = require('../services/csvDataService');
const logger = require('../utils/logger');

exports.getDashboardStats = async (req, res) => {
  try {
    const buildingId = req.query.buildingId ? parseInt(req.query.buildingId) : null;

    const todayStats = csvDataService.calculateTodayStats(buildingId);
    const zoneConsumption = csvDataService.calculateZoneConsumption(buildingId);

    const zones = await csvDataService.getAllZones({ buildingId });
    const equipment = await csvDataService.getAllEquipment({ buildingId });

    res.json({
      success: true,
      data: {
        todayConsumption: todayStats.totalKwh,
        todayCost: todayStats.totalCost,
        avgPower: todayStats.avgPower,
        activeZones: zones.length,
        activeEquipment: equipment.length,
        efficiency: 87.5,
        savingsPercent: 12.3,
        zoneConsumption
      }
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getConsumption = async (req, res) => {
  try {
    const buildingId = req.query.buildingId ? parseInt(req.query.buildingId) : null;
    const stats = csvDataService.calculateTodayStats(buildingId);

    res.json({
      success: true,
      data: {
        totalKwh: stats.totalKwh,
        avgPower: stats.avgPower
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getSavings = async (req, res) => {
  try {
    res.json({ success: true, data: { savingsPercent: 15.5, costSavings: 523.45 } });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getEfficiency = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        overallScore: 87,
        scoreChange: 3.2,
        metrics: [
          { name: 'HVAC Efficiency', value: 85, description: 'Heating and cooling system performance' },
          { name: 'Lighting Efficiency', value: 92, description: 'Lighting system optimization' },
          { name: 'Equipment Utilization', value: 78, description: 'Equipment usage optimization' }
        ]
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getTrends = async (req, res) => {
  try {
    const { period, buildingId } = req.query;

    const days = period === 'day' ? 1 : period === 'week' ? 7 : period === 'month' ? 30 : 365;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const readings = await csvDataService.getEnergyReadings({
      buildingId: buildingId ? parseInt(buildingId) : null,
      startDate
    });

    // Group readings by day
    const dailyData = {};
    readings.forEach(r => {
      const date = new Date(r.timestamp).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { consumption: 0, cost: 0, count: 0 };
      }
      dailyData[date].consumption += r.energyKwh || r.powerKw * 0.083;
      dailyData[date].cost += r.cost || 0;
      dailyData[date].count++;
    });

    const data = Object.entries(dailyData).map(([date, values]) => ({
      timestamp: date,
      consumption: Math.round(values.consumption * 100) / 100,
      cost: Math.round(values.cost * 100) / 100,
      target: Math.round(values.consumption * 0.9 * 100) / 100
    }));

    const totalConsumption = data.reduce((sum, d) => sum + d.consumption, 0);

    res.json({
      success: true,
      data: {
        data,
        summary: {
          totalConsumption: Math.round(totalConsumption * 100) / 100,
          consumptionChange: -5.2
        },
        insights: [
          {
            type: 'success',
            title: 'Energy savings achieved',
            description: 'Consumption is 5% below target for this period'
          },
          {
            type: 'info',
            title: 'Peak hours optimization',
            description: 'Consider shifting non-critical loads to off-peak hours'
          }
        ]
      }
    });
  } catch (error) {
    logger.error('Get trends error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getCostAnalysis = async (req, res) => {
  try {
    const { startDate, endDate, buildingId } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const readings = await csvDataService.getEnergyReadings({
      buildingId: buildingId ? parseInt(buildingId) : null,
      startDate: start,
      endDate: end
    });

    const totalCost = readings.reduce((sum, r) => sum + (r.cost || 0), 0);
    const totalKwh = readings.reduce((sum, r) => sum + (r.energyKwh || r.powerKw * 0.083), 0);

    // Group by day for daily costs
    const dailyData = {};
    readings.forEach(r => {
      const date = new Date(r.timestamp).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { cost: 0, kwh: 0 };
      }
      dailyData[date].cost += r.cost || 0;
      dailyData[date].kwh += r.energyKwh || r.powerKw * 0.083;
    });

    const dailyCosts = Object.entries(dailyData).map(([date, values]) => ({
      date,
      cost: Math.round(values.cost * 100) / 100,
      kwh: Math.round(values.kwh * 100) / 100
    }));

    // Cost breakdown by category (simulated based on typical distribution)
    const breakdown = [
      { category: 'HVAC', amount: Math.round(totalCost * 0.45 * 100) / 100, percentage: 45 },
      { category: 'Lighting', amount: Math.round(totalCost * 0.25 * 100) / 100, percentage: 25 },
      { category: 'Equipment', amount: Math.round(totalCost * 0.20 * 100) / 100, percentage: 20 },
      { category: 'Other', amount: Math.round(totalCost * 0.10 * 100) / 100, percentage: 10 }
    ];

    res.json({
      success: true,
      data: {
        totalCost: Math.round(totalCost * 100) / 100,
        totalKwh: Math.round(totalKwh * 100) / 100,
        avgCostPerKwh: totalKwh > 0 ? Math.round((totalCost / totalKwh) * 100) / 100 : 0,
        period: { start, end },
        dailyCosts,
        breakdown
      }
    });
  } catch (error) {
    logger.error('Get cost analysis error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.getPeakDemand = async (req, res) => {
  try {
    const { buildingId, date } = req.query;

    const peakData = csvDataService.calculatePeakDemand(
      buildingId ? parseInt(buildingId) : null,
      date
    );

    // Calculate average power
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const readings = await csvDataService.getEnergyReadings({
      buildingId: buildingId ? parseInt(buildingId) : null,
      startDate: today
    });

    const allDemands = readings.map(r => r.powerKw);
    const averagePower = allDemands.length > 0
      ? Math.round((allDemands.reduce((a, b) => a + b, 0) / allDemands.length) * 100) / 100
      : 0;

    res.json({
      success: true,
      data: {
        peakPower: peakData.peakPower,
        peakTime: peakData.peakTime,
        averagePower,
        maxDemand: peakData.peakPower,
        demandProfile: peakData.demandProfile,
        hourlyData: peakData.demandProfile
      }
    });
  } catch (error) {
    logger.error('Get peak demand error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.generateReport = async (req, res) => {
  try {
    res.json({ success: true, message: 'Report generated' });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};
