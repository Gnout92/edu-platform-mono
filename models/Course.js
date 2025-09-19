// models/Course.js
const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
  days: [{ type: String, enum: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] }],
  time: { start: String, end: String } // "07:30", "09:30"
}, { _id: false });

const CourseSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },       // VD: CS301
  title: { type: String, required: true },                     // Lập trình Web Nâng cao
  description: { type: String },
  department: { type: String },                                // CNTT, Toán...
  instructor: { type: String, required: true },                // TS. Nguyễn Văn A
  capacity: { type: Number, default: 50 },                     // 50
  enrolledCount: { type: Number, default: 0 },                 // 35/50
  schedule: ScheduleSchema,                                    // Thứ 2,4,6 - 7:30-9:30
  status: { type: String, enum: ['upcoming','ongoing','ending'], default: 'upcoming' }, // Sắp bắt đầu/Đang diễn ra/Sắp kết thúc
  progress: { type: Number, default: 0 },                      // 0..100 (%)
  joinLink: { type: String },                                  // "Vào lớp"
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', CourseSchema);
