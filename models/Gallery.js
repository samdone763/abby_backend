const mongoose = require('mongoose');
const GallerySchema = new mongoose.Schema({
  caption: { type: String, required: true },
  imageData: { type: String, required: true },
  mimeType: { type: String, default: 'image/jpeg' },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Gallery', GallerySchema);
