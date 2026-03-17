const express = require('express');
const router = express.Router();
const Note = require('../models/Note'); 
const Student = require('../models/Student'); 

// 🔥 NEW UPLINK: Naye Faculty Routes ko import kiya
const facultyRoutes = require('./facultyRoutes');

const { 
    studentLogin, 
    registerStudent, 
    sendRegistrationOTP, 
    getDashboardInfo,
    getStudentByRegNo, 
    completeProfile,
    activateStudentVault // ✨ STICKLY ADDED: Imported for Zero-Entry Activation
} = require('../controllers/studentController');

const { protect } = require('../Middleware/authMiddleware');

const multer = require('multer');
const storage = multer.memoryStorage(); 

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } 
});

const { 
    registerFaculty, 
    createLecture, 
    getFaculties, 
    importExcelStudents,
    bulkUploadStudents 
} = require('../controllers/mainController');

const { uploadNote } = require('../controllers/noteController');

// 🛡️ [ATTENDANCE_CONTROLLER_UPLINK]: Strictly Imported (Added getAllStudentsForTable, getFacultyRegisters, deleteMonthlyRegister, updateMonthlyRegister)
const { 
    startAttendanceSession, 
    markAttendance, 
    getAllStudentsForTable, 
    getFacultyRegisters,
    deleteMonthlyRegister,
    updateMonthlyRegister,
    getStudentPersonalLedger, // 🔥 ADDED: Imported strictly for Student Dashboard
    getAvailableSubjects,     // 🔥 NEW PHASE 1: Fetch filtered subjects
    enrollStudent             // 🔥 NEW PHASE 1: Handle student enrollment
} = require('../controllers/attendanceController');

router.post('/admin/register-faculty', registerFaculty);
router.post('/faculty/create-lecture', createLecture);
router.get('/student/faculties', getFaculties);
router.post('/student/login', studentLogin);
router.post('/student/register', registerStudent);
router.post('/student/send-otp', sendRegistrationOTP);
router.get('/student/dashboard-info', protect, getDashboardInfo);

// ✨ MISSION FIX: Alignment with Student Controller & Frontend (Removed '-identity')
router.get('/student/verify/:regNo', getStudentByRegNo); 
router.post('/student/complete-profile', completeProfile);

// 🔥 MISSING LINK FIXED: Added the activation endpoint to stop 404
router.post('/student/activate', activateStudentVault); 

router.get('/admin/students', async (req, res) => {
    try {
        const students = await Student.find().sort({ registeredAt: -1 });
        res.json(students);
    } catch (err) {
        res.status(500).json({ success: false, message: "Vault Access Denied" });
    }
});

router.post('/admin/import-excel', upload.single('excelFile'), importExcelStudents);
router.post('/admin/bulk-upload', upload.single('file'), bulkUploadStudents);
router.post('/upload-note', upload.single('file'), uploadNote);

router.get('/notes/fetch-notes', async (req, res) => {
  try {
    const notes = await Note.find().sort({ uploadedAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: "Vault Fetch Failed" });
  }
});

router.post('/verify-download', (req, res) => {
    res.json({ success: true }); 
});

// --- 🔥 ATTENDANCE REGISTER ROUTES (ACTIVATED) ---

// 1. Faculty side: Attendance Register "OPEN" karna
router.post('/attendance/start-session', startAttendanceSession);

// 2. Student side: Register mein apni entry "MARK" karna
router.post('/attendance/mark-me', markAttendance);

// 3. 🔥 NEW: MongoDB Student Data Fetch (Strictly Added for Manual Table)
router.get('/attendance/all-students', getAllStudentsForTable);

// 4. 🔥 NEW: Fetch Monthly Registers (Strictly Added for Faculty Dashboard Cards)
router.get('/attendance/my-registers', getFacultyRegisters);

// 5. 🔥 CRUD OPS: Delete and Update Monthly Registers (Strictly Added)
router.post('/attendance/delete-register', deleteMonthlyRegister);
router.post('/attendance/update-register', updateMonthlyRegister);

// 6. 🔥 NEW: Student Personal Ledger Route (Strictly Added)
router.get('/attendance/personal-ledger', getStudentPersonalLedger);

// 7. 🔥 NEW PHASE 1: Enrollment Routes
router.get('/attendance/available-subjects', getAvailableSubjects);
router.post('/attendance/enroll-student', enrollStudent);

// 🔥 NEW UPLINK: Faculty Routes ko '/faculty' base path ke sath active kar diya
router.use('/faculty', facultyRoutes);

module.exports = router;