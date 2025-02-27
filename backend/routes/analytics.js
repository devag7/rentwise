const express = require('express');
const db = require('../config/db');
const router = express.Router();

router.get('/price-trends/:area_id', (req, res) => {
  db.query(
    'SELECT year, property_type, average_rent FROM price_history WHERE area_id = ? ORDER BY year',
    [req.params.area_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch trends' });
      res.json(results);
    }
  );
});

module.exports = router;