const { cache } = require('../config/redis');

exports.getSettings = async (req, res) => {
  try {
    const settings = { energyRate: 0.12, temperatureUnit: 'F' };
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    await cache.set('system:settings', req.body, 86400);
    res.json({ success: true, data: req.body });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};
