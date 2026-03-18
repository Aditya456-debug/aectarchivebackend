const Faculty = require('../models/Faculty');
const jwt = require('jsonwebtoken');

// 🔥 1. ADMIN FUNCTION: Generate New Faculty ID (Link this to Admin Panel)
const adminCreateFaculty = async (req, res) => {
    try {
        const { facultyName } = req.body;
        if (!facultyName) return res.status(400).json({ success: false, msg: "Name Required" });

        // Generate Random ID (e.g., FAC-8392)
        const randomCode = Math.floor(1000 + Math.random() * 9000);
        const generatedID = `FAC-${randomCode}`;

        // Create Database Entry with dummy email/pass to pass schema validation
        const newFaculty = new Faculty({
            facultyID: generatedID,
            facultyName: facultyName,
            emailID: `pending_${randomCode}@acet.org`, // Dummy Value
            password: `TEMP_PASS_${randomCode}`, // Dummy Value
            courses: [], // Blank array
            isProfileCompleted: false,
            isAdminApproved: true
        });

        await newFaculty.save();

        res.json({ 
            success: true, 
            msg: "FACULTY_ID_GENERATED", 
            facultyID: generatedID, 
            facultyName 
        });

    } catch (err) {
        console.error("❌ [ADMIN_CREATE_ERROR]:", err);
        res.status(500).json({ success: false, msg: "Server Error generating ID" });
    }
};

// 🔥 2. VERIFY FACULTY ID (Prefill Logic)
const verifyFacultyId = async (req, res) => {
    try {
        const { facultyID } = req.body;
        
        const faculty = await Faculty.findOne({ facultyID: { $regex: new RegExp(`^${facultyID}$`, 'i') } });

        if (!faculty) {
            return res.status(404).json({ success: false, msg: "ACCESS_DENIED: Invalid Faculty ID." });
        }
        
        if (faculty.isProfileCompleted) {
            return res.status(400).json({ success: false, msg: "ALREADY_ACTIVE: Please Login." });
        }

        res.json({
            success: true,
            faculty: { facultyName: faculty.facultyName }, 
            msg: "ID_VERIFIED"
        });
    } catch (err) {
        res.status(500).json({ success: false, msg: "Server Error" });
    }
};

// 🔥 3. COMPLETE REGISTRATION (Now saves Courses too!)
const completeFacultyProfile = async (req, res) => {
    try {
        const { facultyID, emailID, password, courses } = req.body;

        const faculty = await Faculty.findOne({ facultyID: { $regex: new RegExp(`^${facultyID}$`, 'i') } });
        if (!faculty) return res.status(404).json({ success: false, msg: "FACULTY_NOT_FOUND" });

        // Update fields with Faculty's inputs
        faculty.emailID = emailID;
        faculty.password = password; 
        faculty.courses = courses; 
        faculty.isProfileCompleted = true;

        await faculty.save();

        res.json({ success: true, msg: "VAULT_SECURED: Registration Complete!" });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, msg: "EMAIL_TAKEN: Email in use." });
        }
        res.status(500).json({ success: false, msg: "System Error." });
    }
};

// 🔥 4. SECURE FACULTY LOGIN
const facultyLogin = async (req, res) => {
    try {
        const { facultyID, password } = req.body;

        const faculty = await Faculty.findOne({ facultyID: { $regex: new RegExp(`^${facultyID}$`, 'i') } });

        if (!faculty || !faculty.isProfileCompleted) {
            return res.status(404).json({ success: false, msg: "NO_ACTIVE_VAULT: Register first." });
        }

        if (faculty.password !== password) {
            return res.status(401).json({ success: false, msg: "ACCESS_DENIED: Wrong Password." });
        }

        const token = jwt.sign(
            { id: faculty._id, facultyID: faculty.facultyID },
            process.env.JWT_SECRET || 'CYBER_NEXUS_CORE_SECRET',
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            faculty: {
                facultyName: faculty.facultyName,
                facultyID: faculty.facultyID,
                courses: faculty.courses 
            },
            msg: "UPLINK_SUCCESS"
        });
    } catch (err) {
        res.status(500).json({ success: false, msg: "Login Failed!" });
    }
};

// 🔥 NEW: MISSION FACULTY RESONANCE - GET PROFILE & ASSIGNED CLASSES
const getFacultyProfile = async (req, res) => {
    try {
        const { email } = req.params;
        // ⚡ STICKLY UPDATED: Using emailID to match your MongoDB Atlas Schema
        const faculty = await Faculty.findOne({ emailID: email.trim() });

        if (!faculty) {
            return res.status(404).json({ success: false, message: "FACULTY_NOT_FOUND" });
        }

        res.status(200).json({
            success: true,
            data: {
                name: faculty.facultyName,
                id: faculty.facultyID,
                assignedClasses: faculty.assignedClasses || [],
                lectures: faculty.lectures || []
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 🔥 5. LECTURE CREATION (Existing Vault functionality)
const createLecture = async (req, res) => {
    try {
        const { unit, date, topic, desc, time, facultyEmail } = req.body;
        // ⚡ STICKLY UPDATED: Added emailID check to ensure Vault Sync
        const faculty = await Faculty.findOne({ 
            $or: [{ emailID: facultyEmail }, { email: facultyEmail }] 
        });
        
        if (!faculty) return res.status(404).json({ success: false, msg: "FACULTY_IDENTITY_UNKNOWN" });

        if (!faculty.lectures) faculty.lectures = [];
        faculty.lectures.push({ unit, date, topic, desc, time });
        await faculty.save();

        res.json({ success: true, msg: "LECTURE_SYNCED_TO_VAULT" });
    } catch (err) {
        res.status(500).json({ success: false, msg: "Database Uplink Failed" });
    }
};

module.exports = { adminCreateFaculty, verifyFacultyId, completeFacultyProfile, facultyLogin, getFacultyProfile, createLecture };