// models/Assignment.js
const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },         // "Bài tập React Hooks"
  dueDate: { type: Date, required: true },         // Hạn: 25/09/2025
  status: { type: String, enum: ['open','grading','done'], default: 'open' },
  submitted: { type: Number, default: 0 },
  total: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Assignment', AssignmentSchema);
