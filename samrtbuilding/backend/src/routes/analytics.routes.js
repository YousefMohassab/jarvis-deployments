const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
router.get('/dashboard', analyticsController.getDashboardStats);
router.get('/consumption', analyticsController.getConsumption);
router.get('/savings', analyticsController.getSavings);
router.get('/efficiency', analyticsController.getEfficiency);
router.get('/trends', analyticsController.getTrends);
router.get('/cost', analyticsController.getCostAnalysis);
router.get('/peak-demand', analyticsController.getPeakDemand);
router.post('/reports', analyticsController.generateReport);

module.exports = router;
