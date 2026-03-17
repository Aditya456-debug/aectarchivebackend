const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty'); // 🔥 ADDED: For Faculty Notifications
const mongoose = require('mongoose');

// 1. 🏫 Faculty side: Daily/Register Start karna (🔥 UPDATED: Period System Removed)
const startAttendanceSession = async (req, res) => {
    try {
        const { facultyEmail, facultyName, subjectName, course, semester, section, selectedDate, classType, sessionYear, month } = req.body;

        // Agar faculty ne calendar se date chuni hai toh wo, nahi toh default today
        const targetDate = selectedDate || new Date().toLocaleDateString('en-GB');

        // 🔥 MONTH_LOGIC: Use selected month or detect current
        const targetMonth = month || new Date().toLocaleString('default', { month: 'long' });

        // 🔥 LOGIC CHANGE: Check if a register for this Subject + Section + Month already exists
        // This prevents creating a second card for the same class in the same month.
        let session = await Attendance.findOne({ 
            facultyEmail, 
            subjectName: subjectName.toUpperCase(),
            section: section.toUpperCase(),
            month: targetMonth,
            sessionYear: sessionYear
        });

        // If it exists, don't create a new card, just return the existing sessionId
        if (session) {
            return res.status(200).json({ 
                success: true, 
                msg: `VAULT_SYNCED: Using existing register for ${subjectName}`, 
                sessionId: session._id 
            });
        }

        // If no register exists, establish a brand new one
        const validFacultyId = mongoose.Types.ObjectId.isValid(req.body.facultyId) 
            ? req.body.facultyId 
            : new mongoose.Types.ObjectId(); 

        session = new Attendance({
            facultyId: validFacultyId, 
            facultyEmail,
            facultyName: facultyName || "PROF. SYSTEM ADMIN",
            subjectName: subjectName.toUpperCase(),
            course,
            semester,
            section: section.toUpperCase(),
            date: targetDate,
            month: targetMonth, 
            classType: classType,    // Theory / Practical / Lab
            sessionYear: sessionYear, // 2024-2025
            period: 0,   // 🔥 Period set to 0 as system is now card-based
            presentStudents: [],
            isActive: true
        });
        await session.save();

        res.status(200).json({ 
            success: true, 
            msg: `NEW_REGISTER_ESTABLISHED: ${subjectName} for ${targetMonth}`, 
            sessionId: session._id 
        });

    } catch (err) {
        console.error("❌ [SESSION_ERROR]:", err);
        res.status(500).json({ success: false, msg: "Failed to initialize register" });
    }
};

// 2. 👥 Student side: Specific Attendance mark karna (UNTOUCHED)
const markAttendance = async (req, res) => {
    try {
        const { regNo, facultyEmail, subjectName } = req.body;
        const today = new Date().toLocaleDateString('en-GB');

        // 🔥 Period removed from lookup
        const session = await Attendance.findOne({ 
            facultyEmail, 
            subjectName, 
            date: today, 
            isActive: true 
        });

        if (!session) {
            return res.status(404).json({ success: false, msg: "NO_ACTIVE_SESSION: Register is currently locked!" });
        }

        const alreadyMarked = session.presentStudents.find(s => s.regNo === regNo);
        if (alreadyMarked) {
            return res.status(400).json({ success: false, msg: "DUPLICATE_ENTRY: Attendance already logged for today!" });
        }

        const student = await Student.findOne({ regNo });
        if (!student) {
            return res.status(404).json({ success: false, msg: "STUDENT_NOT_FOUND" });
        }

        session.presentStudents.push({
            regNo: student.regNo,
            name: student.name,
            markedAt: new Date()
        });

        await session.save();

        res.status(200).json({ 
            success: true, 
            msg: `SUCCESS: Attendance Marked!`, 
            studentName: student.name 
        });

    } catch (err) {
        console.error("❌ [MARKING_ERROR]:", err);
        res.status(500).json({ success: false, msg: "Server Error" });
    }
};

// 🔥 UPDATED: Fetch students filtered by SECTION for 90% faster load
const getAllStudentsForTable = async (req, res) => {
    try {
        const { section } = req.query;
        const query = section ? { section: section.toUpperCase() } : {};
        
        const students = await Student.find(query, 'name regNo section').sort({ regNo: 1 });
        res.json({ success: true, students });
    } catch (err) {
        console.error("❌ [FETCH_ERROR]:", err);
        res.status(500).json({ success: false, msg: "Database Uplink Fail!" });
    }
};

// 🔥 UPDATED: Fetch Unique Monthly Registers
const getFacultyRegisters = async (req, res) => {
    try {
        const { facultyEmail } = req.query;
        const registers = await Attendance.aggregate([
            { $match: { facultyEmail } },
            { $group: { 
                _id: { 
                    subjectName: "$subjectName", 
                    month: "$month", 
                    course: "$course",
                    semester: "$semester",
                    section: "$section",
                    sessionYear: "$sessionYear",
                    classType: "$classType"
                },
                lastUsed: { $max: "$date" }
            }},
            { $sort: { lastUsed: -1 } }
        ]);
        res.json({ success: true, registers });
    } catch (err) {
        res.status(500).json({ success: false, msg: "Registers fetch failed" });
    }
};

// 🔥 CRUD OPERATIONS (DELETE/UPDATE)
const deleteMonthlyRegister = async (req, res) => {
    try {
        const { subjectName, month, facultyEmail } = req.body;
        await Attendance.deleteMany({ subjectName, month, facultyEmail });
        res.json({ success: true, msg: "Register Permanently Deleted!" });
    } catch (err) {
        res.status(500).json({ success: false, msg: "Delete Failed!" });
    }
};

const updateMonthlyRegister = async (req, res) => {
    try {
        const { oldSubject, oldMonth, facultyEmail, newSubject, newMonth } = req.body;
        await Attendance.updateMany(
            { subjectName: oldSubject, month: oldMonth, facultyEmail },
            { $set: { subjectName: newSubject, month: newMonth } }
        );
        res.json({ success: true, msg: "Register Details Updated!" });
    } catch (err) {
        res.status(500).json({ success: false, msg: "Update Failed!" });
    }
};

// 🔥 MONTHLY LEDGER LOGIC
const getMonthlyLedgerData = async (req, res) => {
    try {
        const { facultyEmail, subjectName, month } = req.query;
        const monthlyData = await Attendance.find({ facultyEmail, subjectName, month });
        res.json({ success: true, data: monthlyData });
    } catch (err) {
        res.status(500).json({ success: false, msg: "Ledger Data Fetch Failed!" });
    }
};

// 🔥 PROFESSIONAL STUDENT PERSONAL LEDGER
const getStudentPersonalLedger = async (req, res) => {
    try {
        const { regNo, month } = req.query;

        const student = await Student.findOne({ regNo });
        if (!student || !student.enrolledSubjects) {
            return res.json({ success: true, subjects: [] });
        }

        const subjectsData = [];

        for (const enrollment of student.enrolledSubjects) {
            const { subjectName, facultyEmail } = enrollment;

            const sessionTemplate = await Attendance.findOne({ subjectName, facultyEmail }).sort({ date: -1 });
            const facultyDisplayName = sessionTemplate?.facultyName || "PROF. SYSTEM ADMIN";

            const allSessions = await Attendance.find({ subjectName, month });
            
            const totalClasses = allSessions.length;
            let presentClasses = 0;
            
            const attendanceDetail = allSessions.map(session => {
                const isPresent = session.presentStudents.some(s => s.regNo === regNo);
                if (isPresent) presentClasses++;
                return {
                    date: session.date,
                    status: isPresent ? "P" : "A"
                };
            });

            const percentage = totalClasses > 0 ? ((presentClasses / totalClasses) * 100).toFixed(1) : 0;

            subjectsData.push({
                subjectName,
                facultyName: facultyDisplayName, 
                totalClasses,
                presentClasses,
                percentage: `${percentage}%`,
                ledger: attendanceDetail
            });
        }

        res.json({
            success: true,
            subjects: subjectsData
        });

    } catch (err) {
        console.error("❌ [STUDENT_LEDGER_ERROR]:", err);
        res.status(500).json({ success: false, msg: "Terminal Ledger Sync Failed" });
    }
};

// 🔥 SECTION FILTERED SUBJECTS
const getAvailableSubjects = async (req, res) => {
    try {
        const { section } = req.query;
        const subjects = await Attendance.aggregate([
            { $match: { section: section.toUpperCase() } },
            { $group: {
                _id: "$subjectName",
                facultyEmail: { $first: "$facultyEmail" },
                course: { $first: "$course" }
            }}
        ]);

        const formattedSubjects = subjects.map(s => ({
            subjectName: s._id,
            facultyEmail: s.facultyEmail,
            course: s.course
        }));

        res.json({ success: true, subjects: formattedSubjects });
    } catch (err) {
        console.error("❌ [FETCH_SUBJECTS_ERROR]:", err);
        res.status(500).json({ success: false, msg: "Failed to fetch subjects" });
    }
};

// 🔥 REAL ENROLLMENT LOGIC
const enrollStudent = async (req, res) => {
    try {
        const { regNo, subjectName, facultyEmail } = req.body;

        const student = await Student.findOne({ regNo });
        if (!student) return res.status(404).json({ success: false, msg: "STUDENT_NOT_FOUND" });

        const isAlreadyEnrolled = student.enrolledSubjects && student.enrolledSubjects.some(sub => sub.subjectName === subjectName);
        if (!isAlreadyEnrolled) {
            if (!student.enrolledSubjects) student.enrolledSubjects = [];
            student.enrolledSubjects.push({ subjectName, facultyEmail });
            await student.save();
        }

        const faculty = await Faculty.findOne({ emailID: facultyEmail }) || await Faculty.findOne({ email: facultyEmail });
        if (faculty) {
            if (!faculty.notifications) faculty.notifications = [];
            faculty.notifications.push({
                message: `SYSTEM_ALERT: ${student.name} [${regNo}] Enrolled in ${subjectName}`
            });
            await faculty.save();
        }
        
        res.json({ success: true, msg: `LINK_ESTABLISHED: ${subjectName}` });
    } catch (err) {
        res.status(500).json({ success: false, msg: "Enrollment logic failed" });
    }
};

module.exports = { 
    startAttendanceSession, 
    markAttendance, 
    getAllStudentsForTable, 
    getFacultyRegisters,
    deleteMonthlyRegister,
    updateMonthlyRegister,
    getMonthlyLedgerData,
    getStudentPersonalLedger,
    getAvailableSubjects,
    enrollStudent
};