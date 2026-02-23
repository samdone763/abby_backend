const express = require('express');
const router = express.Router();
const Gallery = require('../models/Gallery');
const jwt = require('jsonwebtoken');

function authCheck(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET || 'abby_secret_key');
    next();
  } catch(e) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
}

// GET all photos (public)
router.get('/', async (req, res) => {
  try {
    const photos = await Gallery.find().sort({ createdAt: -1 });
    res.json({ success: true, data: photos });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST upload photo (admin only)
router.post('/', authCheck, async (req, res) => {
  try {
    const { caption, imageData } = req.body;
    if (!caption || !imageData) return res.status(400).json({ success: false, message: 'Caption and image required' });
    const photo = await Gallery.create({ caption, imageData });
    res.json({ success: true, data: photo });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// DELETE photo (admin only)
router.delete('/:id', authCheck, async (req, res) => {
  try {
    await Gallery.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
