const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipment.controller');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);
router.get('/', equipmentController.getAllEquipment);
router.get('/:id', equipmentController.getEquipment);
router.post('/:id/control', equipmentController.controlEquipment);
router.get('/:id/maintenance', equipmentController.getMaintenanceHistory);
router.put('/:id/maintenance', equipmentController.updateMaintenance);

module.exports = router;
