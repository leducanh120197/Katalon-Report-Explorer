const express = require('express');
const ApiController = require('../controllers/ApiController');

const router = express.Router();

// Sử dụng controllers
router.post('/create-html', express.json(), ApiController.createHtmlReport);
router.delete('/delete-html', express.json(), ApiController.deleteHtmlReport);

module.exports = router;