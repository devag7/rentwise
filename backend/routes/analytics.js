const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/price-trends/:area_id', analyticsController.getPriceTrends);

module.exports = router;