const express = require('express');
const router = express.Router();
const energyController = require('../controllers/energy.controller');

// Get current energy consumption
router.get('/current', energyController.getCurrentEnergy);

// Get historical energy data
router.get('/historical', energyController.getHistoricalEnergy);

// Get energy by zones
router.get('/zones', energyController.getEnergyByZones);

// Get peak demand
router.get('/peak-demand', energyController.getPeakDemand);

// Get energy forecast
router.get('/forecast', energyController.getForecast);

// Get energy summary
router.get('/summary', energyController.getEnergySummary);

module.exports = router;
