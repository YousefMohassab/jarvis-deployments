const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { authenticateToken, authorize } = require('../middleware/auth');

router.use(authenticateToken);
router.get('/', settingsController.getSettings);
router.put('/', authorize('admin'), settingsController.updateSettings);

module.exports = router;
