const Student = require('../models/Student');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer'); // 🔥 Added for Email Services

// 🚀 Transporter (Bypass Mode mein iski zaroorat nahi, par error na aaye isliye rakha hai)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

console.log("DEBUG_UPLINK:", process.env.EMAIL_USER, process.env.EMAIL_PASS ? "PASSWORD_DETECTED" : "NO_PASSWORD");

const studentLogin = async (req, res) => {
    try {
        const { collegeId, password } = req.body;

        // 1. Student ko find karna (🛡️ FIXED: Checking both collegeId and regNo for Excel Vault data)
        const student = await Student.findOne({ 
            $or: [{ collegeId: collegeId }, { regNo: collegeId }] 
        });

        if (!student) {
            return res.status(404).json({ success: false, msg: "ID NOT_FOUND: System mein entry nahi hai!" });
        }

        // 2. Password check (Abhi simple string match, baad mein bcrypt lagayenge)
        if (student.password !== password) {
            return res.status(401).json({ success: false, msg: "ACCESS_DENIED: Galat Password!" });
        }

        // 3. JWT Token generate karna (Secret key .env se aayegi)
        const token = jwt.sign(
            { id: student._id, collegeId: student.collegeId || student.regNo },
            process.env.JWT_SECRET || 'CYBER_NEX_CORE_SECRET',
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            student: {
                name: student.name,
                collegeId: student.collegeId || student.regNo,
                course: student.course,
                // 🔥 STRICTLY FIXED: Sending section data so frontend doesn't save 'undefined'
                section: student.section 
            },
            msg: "UPLINK_SUCCESS: Welcome to Student Node"
        });

    } catch (err) {
        console.error("❌ [AUTH_ERROR]:", err);
        res.status(500).json({ success: false, msg: "System Auth Failure!" });
    }
};

// 🔥 Student Registration Logic (Untouched)
const registerStudent = async (req, res) => {
    try {
        const { collegeId, name, password, semester, course, email, phone, section } = req.body; 

        // 1. Check if identity already exists
        const existingStudent = await Student.findOne({ collegeId });
        if (existingStudent) {
            return res.status(400).json({ success: false, msg: "DENIED: Identity already registered in Vault!" });
        }

        // 2. Create new entity
        const newStudent = new Student({
            collegeId,
            name,
            password, 
            semester,
            course,
            email,
            phone,
            section 
        });

        await newStudent.save();

        res.json({
            success: true,
            msg: "ENTITY_SYNC_SUCCESSFUL: Identity Stored in Vault!"
        });

    } catch (err) {
        console.error("❌ [REGISTRATION_ERROR]:", err);
        res.status(500).json({ success: false, msg: "Critical Database Uplink Failure!" });
    }
};

// 🔥 OTP Registration Logic (Bypass Mode Enabled)
const sendRegistrationOTP = async (req, res) => {
    try {
        const { email, name } = req.body;
        
        // Asli random OTP generate hoga
        const otp = Math.floor(100000 + Math.random() * 900000);

        // 🚀 BYPASS: Email sending block ko comment kar diya taaki login error na aaye
        /*
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'CYBER_NEXUS | NEURAL_VERIFICATION',
            html: `...`
        };
        await transporter.sendMail(mailOptions);
        */

        console.log(`-----------------------------------------`);
        console.log(`🚀 [BYPASS_UPLINK]: OTP for ${name} is: ${otp}`);
        console.log(`-----------------------------------------`);

        res.json({ 
            success: true, 
            msg: "OTP_DISPATCHED_IN_BYPASS_MODE", 
            code: otp 
        }); 

    } catch (err) {
        console.error("❌ [BYPASS_ERROR]:", err);
        res.status(500).json({ success: false, msg: "MAIL_SYSTEM_BYPASSED" });
    }
};

// 🔥 NEW: Fetch Student Profile for Dashboard (Strictly Added)
const getDashboardInfo = async (req, res) => {
    try {
        const student = await Student.findById(req.student.id).select('-password');
        if (!student) {
            return res.status(404).json({ success: false, msg: "STUDENT_NOT_FOUND" });
        }
        res.json({ success: true, student });
    } catch (err) {
        res.status(500).json({ success: false, msg: "CORE_DATA_FAILURE" });
    }
};

// 🔥 NEW: GET STUDENT BY REG_NO 
const getStudentByRegNo = async (req, res) => {
    try {
        const { regNo } = req.params;
        
        // Anti-404 Fallback handled at router level, decoded here just in case
        const decodedReg = decodeURIComponent(regNo);
        
        const student = await Student.findOne({ 
            regNo: { $regex: new RegExp(`^${decodedReg}$`, 'i') } 
        });

        if (!student) {
            return res.status(404).json({ success: false, msg: "IDENTITY_NOT_FOUND_IN_VAULT" });
        }

        if (student.isProfileCompleted) {
            return res.status(400).json({ success: false, msg: "IDENTITY_ALREADY_CLAIMED" });
        }

        res.json({ success: true, student });
    } catch (err) {
        console.error("Fetch Error:", err);
        res.status(500).json({ success: false, msg: "FETCH_ERROR" });
    }
};

// 🔥 ULTIMATE FIX: COMPLETE PROFILE LOGIC 
const completeProfile = async (req, res) => {
    try {
        const { regNo, password, phone, name, section, course, year, semester, email } = req.body;
        
        let student = await Student.findOne({ regNo: { $regex: new RegExp(`^${regNo}$`, 'i') } });

        if (student) {
            student.password = password;
            student.phone = phone;
            student.name = name;
            student.section = section; 
            student.course = course;   
            student.year = year; // 🚀 FIX: Year Saved
            student.semester = semester;
            student.email = email;
            student.isProfileCompleted = true;
            await student.save();
        } else {
            student = new Student({
                regNo,
                password,
                phone,
                name,
                section, 
                course,  
                year, // 🚀 FIX: Year Saved
                semester,
                email,
                isProfileCompleted: true
            });
            await student.save();
        }

        res.json({ success: true, msg: "IDENTITY_VERIFIED_AND_LOCKED", student });
    } catch (err) {
        console.error("❌ [UPDATE_ERROR]:", err);
        res.status(500).json({ success: false, msg: "UPDATE_ERROR" });
    }
};

// 🔥 NEW: ACTIVATION PROTOCOL UPDATED (Saves All Missing Fields Including Year)
const activateStudentVault = async (req, res) => {
    try {
        // Form frontend se ye sab bhejne wala hai (par pehle tera backend isko ignore kar raha tha)
        const { regNo, password, name, course, section, year, semester, email, phone } = req.body;

        let student = await Student.findOne({ regNo: regNo.toUpperCase() });

        // Agar form Submit hota hai without Excel pre-existence, tabhi naya banega varna update hoga
        if (!student) {
            // New user registration directly from portal
            student = new Student({ regNo: regNo.toUpperCase() });
        } else if (student.isProfileCompleted) {
            return res.status(400).json({ success: false, msg: "VAULT_ALREADY_LOCKED" });
        }

        // 🔥 FULL DATA COMMIT (Yahan year database me finally ghusega!)
        if (password) student.password = password;
        if (name) student.name = name.toUpperCase();
        if (course) student.course = course;
        if (section) student.section = section;
        if (year) student.year = String(year); // 👈 Year is committed!
        if (semester) student.semester = String(semester);
        if (email) student.email = email.toLowerCase();
        if (phone) student.phone = phone;
        
        student.isProfileCompleted = true;
        
        await student.save();

        res.status(200).json({ 
            success: true, 
            msg: "VAULT_ACTIVATED",
            studentName: student.name 
        });

    } catch (error) {
        console.error("Activation Error:", error);
        res.status(500).json({ success: false, msg: "ACTIVATION_CRITICAL_FAILURE" });
    }
};

module.exports = { 
    studentLogin, 
    registerStudent, 
    sendRegistrationOTP, 
    getDashboardInfo, 
    getStudentByRegNo, 
    completeProfile,
    activateStudentVault
};