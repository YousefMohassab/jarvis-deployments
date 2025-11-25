// Simple settings storage (could be expanded to use JSON file if needed)
let systemSettings = {
  energyRate: 0.12,
  temperatureUnit: 'C',
  currency: 'USD',
  timezone: 'America/Los_Angeles'
};

exports.getSettings = async (req, res) => {
  try {
    res.json({ success: true, data: systemSettings });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    systemSettings = { ...systemSettings, ...req.body };
    res.json({ success: true, data: systemSettings });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};
