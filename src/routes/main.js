const express = require('express');
const MainController = require('../controllers/MainController');

const router = express.Router();

// Sử dụng controllers
router.get('/', MainController.showHomePage);
router.get('/tree-show', MainController.showTreeJson);
router.get('/view', MainController.viewFile);

module.exports = router;