const express = require('express');
const ApiController = require('../controllers/ApiController');

const router = express.Router();

// Sử dụng controllers
router.post('/create-html', express.json(), ApiController.createHtmlReport);
router.delete('/delete-html', express.json(), ApiController.deleteHtmlReport);

// Auto-startup endpoints
router.get('/auto-start/status', ApiController.getAutoStartStatus);
router.post('/auto-start/toggle', ApiController.toggleAutoStart);
router.post('/auto-start/enable', ApiController.enableAutoStart);
router.post('/auto-start/disable', ApiController.disableAutoStart);

module.exports = router;