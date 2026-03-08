const express = require('express');
const router = express.Router();
const multer = require('multer');
const propertyController = require('../controllers/propertyController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 }, // 500KB limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/jpg|jpeg|png/)) return cb(new Error('Only JPG/PNG allowed'));
    cb(null, true);
  },
});

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

router.post('/', authenticate, upload.single('image'), propertyController.addProperty);
router.get('/', propertyController.getProperties);
router.get('/:id', propertyController.getPropertyById);

module.exports = router;