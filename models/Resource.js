// models/Resource.js
const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  name: { type: String, required: true },        // "Bài giảng React Hooks.pdf"
  type: { type: String, enum: ['pdf','video','slide','code','other'], default: 'other' },
  sizeMB: { type: Number, default: 0 },
  downloads: { type: Number, default: 0 },
  url: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Resource', ResourceSchema);
