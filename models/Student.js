const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    // 🔥 Changed collegeId to regNo to match CSV perfectly
    regNo: { type: String, required: true, unique: true }, 
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, 
    name: { type: String },
    course: { type: String },
    year: { type: String, default: "1" },
    semester: { type: String },
    phone: { type: String },
    registeredAt: { type: Date, default: Date.now },
    // 🔥 STICKLY UPDATED: Section field with A-Z constraint
    section: { 
        type: String, 
        uppercase: true, 
        enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'] 
    }, 
    isProfileCompleted: { type: Boolean, default: false },
    
    // 🔥 NEW PHASE 1: Storage for student's enrolled subjects
    enrolledSubjects: [{
        subjectName: String,
        facultyEmail: String,
        enrolledAt: { type: Date, default: Date.now }
    }]
});

module.exports = mongoose.model('Student', StudentSchema);