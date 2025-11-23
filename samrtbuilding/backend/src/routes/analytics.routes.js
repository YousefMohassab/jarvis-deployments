const express = require('express');
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
