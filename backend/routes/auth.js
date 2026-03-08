const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Add this at the top of your auth.js file
if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is not set in environment variables. Using fallback secret for development.');
}

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authController.getMe);

module.exports = router;