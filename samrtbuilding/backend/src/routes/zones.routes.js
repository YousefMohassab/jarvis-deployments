const express = require('express');
const router = express.Router();
const zonesController = require('../controllers/zones.controller');
router.get('/', zonesController.getAllZones);
router.post('/', zonesController.createZone);
router.get('/:id', zonesController.getZone);
router.put('/:id', zonesController.updateZone);
router.delete('/:id', zonesController.deleteZone);
router.put('/:id/setpoint', zonesController.updateSetpoint);
router.get('/:id/schedule', zonesController.getSchedule);
router.put('/:id/schedule', zonesController.updateSchedule);

module.exports = router;
