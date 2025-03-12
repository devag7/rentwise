const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const router = express.Router();

// Add this at the top of your auth.js file
if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is not set in environment variables. Using fallback secret for development.');
}


router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;
  if (!['landlord', 'tenant'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  const hashedPassword = await bcrypt.hash(password, 10);
  db.query(
    'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
    [username, email, hashedPassword, role],
    (err) => {
      if (err) return res.status(500).json({ error: 'Registration failed' });
      res.status(201).json({ message: 'User registered' });
    }
  );
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err || !results.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = results[0];
    if (!(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Invalid credentials' });
    
    // Create token with user data
    const token = jwt.sign(
      { userId: user.user_id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' } // Increased to 7 days for better user experience
    );
    
    // Return token AND user information needed by frontend
    res.json({ 
      token, 
      userId: user.user_id,
      role: user.role 
    });
  });
});

router.get('/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Use environment variable for JWT secret
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    db.query(
      'SELECT user_id, username, email, role FROM users WHERE user_id = ?',
      [decoded.userId],
      (err, results) => {
        if (err || !results.length) return res.status(404).json({ error: 'User not found' });
        res.json(results[0]);
      }
    );
  });
});

module.exports = router;