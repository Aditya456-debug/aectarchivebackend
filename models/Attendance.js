const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
    facultyEmail: String,
    facultyName: String, // 🔥 STRICTLY ADDED: For professional student ledger display
    subjectName: String,
    course: String,
    semester: String,
    section: String,
    date: String,
    month: String, // 🔥 NEW: Strictly added for Monthly Register Link
    // 🔥 NEW FIELDS: Strictly added for your new system
    sessionYear: String, // EX: 2024-2025
    classType: String,   // EX: Theory / Practical / Lab
    period: Number,
    presentStudents: [
        {
            regNo: String,
            name: String,
            markedAt: { type: Date, default: Date.now }
        }
    ],
    isActive: { type: Boolean, default: true }
});

// 🔥 YE LINE CHECK KAR: Aise hi honi chahiye (Default Export)
module.exports = mongoose.model('Attendance', attendanceSchema);