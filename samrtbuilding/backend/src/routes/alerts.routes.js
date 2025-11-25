const express = require('express');
const router = express.Router();
const alertsController = require('../controllers/alerts.controller');
router.get('/', alertsController.getAllAlerts);
router.get('/:id', alertsController.getAlert);
router.put('/:id/acknowledge', alertsController.acknowledgeAlert);
router.put('/:id/resolve', alertsController.resolveAlert);
router.post('/settings', alertsController.updateSettings);

module.exports = router;
