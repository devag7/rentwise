const db = require('../config/db');

// Add new property controller
exports.addProperty = (req, res) => {
    const { area_id, address, property_type, size, rent, preferences, landlord_phone, google_maps_link } = req.body;
    const image_data = req.file ? req.file.buffer : null;
    if (rent < 5000 || rent > 200000) return res.status(400).json({ error: 'Rent must be ₹5k-₹2L' });

    db.query(
        'INSERT INTO properties (landlord_id, area_id, address, property_type, size, rent, preferences, image_data, landlord_phone, google_maps_link) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [req.user.userId, area_id, address, property_type, size, rent, preferences, image_data, landlord_phone, google_maps_link],
        (err) => {
            if (err) return res.status(500).json({ error: 'Failed to add property' });
            res.status(201).json({ message: 'Property added' });
        }
    );
};

// Get all properties with filters
exports.getProperties = (req, res) => {
    const { area_id, property_type, min_rent, max_rent } = req.query;
    let sql = `
    SELECT p.*, a.area_name,
      CASE p.property_type
        WHEN '1BHK' THEN a.average_rent_1bhk
        WHEN '2BHK' THEN a.average_rent_2bhk
        WHEN '3BHK' THEN a.average_rent_3bhk
        WHEN '1RK' THEN a.average_rent_1rk
        WHEN 'PG' THEN a.average_rent_pg
      END AS area_avg
    FROM properties p JOIN areas a ON p.area_id = a.area_id WHERE 1=1`;
    const params = [];

    if (area_id) { sql += ' AND p.area_id = ?'; params.push(area_id); }
    if (property_type) { sql += ' AND p.property_type = ?'; params.push(property_type); }
    if (min_rent) { sql += ' AND p.rent >= ?'; params.push(min_rent); }
    if (max_rent) { sql += ' AND p.rent <= ?'; params.push(max_rent); }

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch properties' });
        const properties = results.map((p) => ({
            ...p,
            image_data: p.image_data ? p.image_data.toString('base64') : null,
            priceStatus: p.rent > p.area_avg * 1.2 ? 'overpriced' : 'fair',
        }));
        res.json(properties);
    });
};

// Get single property details
exports.getPropertyById = (req, res) => {
    db.query(
        `
    SELECT p.*, a.area_name,
      CASE p.property_type
        WHEN '1BHK' THEN a.average_rent_1bhk
        WHEN '2BHK' THEN a.average_rent_2bhk
        WHEN '3BHK' THEN a.average_rent_3bhk
        WHEN '1RK' THEN a.average_rent_1rk
        WHEN 'PG' THEN a.average_rent_pg
      END AS area_avg
    FROM properties p JOIN areas a ON p.area_id = a.area_id WHERE p.property_id = ?`,
        [req.Params.id || req.params.id],
        (err, results) => {
            if (err || !results.length) return res.status(404).json({ error: 'Property not found' });
            const p = results[0];
            res.json({
                ...p,
                image_data: p.image_data ? p.image_data.toString('base64') : null,
                priceStatus: p.rent > p.area_avg * 1.2 ? 'overpriced' : 'fair',
            });
        }
    );
};
