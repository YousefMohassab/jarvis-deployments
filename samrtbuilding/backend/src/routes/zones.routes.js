const express = require('express');
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
