const express = require('express');
const router = express.Router();
const Gallery = require('../models/Gallery');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

function authCheck(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET || 'abby_secret_key');
    next();
  } catch(e) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
}

// GET all photos
router.get('/', async (req, res) => {
  try {
    const photos = await Gallery.find().sort({ createdAt: -1 });
    res.json({ success: true, data: photos });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST upload photo
router.post('/upload', authCheck, upload.single('photo'), async (req, res) => {
  try {
    const caption = req.body.caption || '';
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const imageData = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    const photo = await Gallery.create({ caption, imageData, mimeType });
    res.json({ success: true, data: photo });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// DELETE photo
router.delete('/:id', authCheck, async (req, res) => {
  try {
    await Gallery.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
