const mongoose = require('mongoose');

const FacultySchema = new mongoose.Schema({
    // 🔥 NEW: Unique ID assigned by Admin for prefilling logic
    facultyID: { type: String, required: true, unique: true }, 
    
    facultyName: { type: String, required: true },
    emailID: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    // 🔥 UPDATED: Now an Array to support multi-course teaching (MCA + BCA)
    courses: [String], 

    section: String,
    semester: String,
    subjectName: String,

    // 🔥 NEW: NEURAL LINK (ASSIGNED CLASSES TO THIS FACULTY)
    assignedClasses: [{
        course: { type: String },
        semester: { type: String },
        section: { type: String },
        subject: { type: String }
    }],

    // 🔥 NEW: Security & Admin Control Flags
    isProfileCompleted: { type: Boolean, default: false },
    isAdminApproved: { type: Boolean, default: false },

    lectures: [{
        unit: String,
        date: String,
        topic: String,
        desc: String,
        time: String
    }],
    
    // 🔥 NEW PHASE 1: Notifications array for student enrollment alerts
    notifications: [{
        message: String,
        date: { type: Date, default: Date.now }
    }]
});

module.exports = mongoose.model('Faculty', FacultySchema);