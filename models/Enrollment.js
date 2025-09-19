// models/Enrollment.js
const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['student','instructor'], default: 'student' },
  status: { type: String, enum: ['enrolled','dropped','completed'], default: 'enrolled' },
  attendanceRate: { type: Number, default: 0 }, // tỉ lệ chuyên cần
  gradeAverage: { type: Number, default: 0 }    // điểm trung bình
}, { timestamps: true });

module.exports = mongoose.model('Enrollment', EnrollmentSchema);
