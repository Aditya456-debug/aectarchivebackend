const express = require('express');
const router = express.Router();
const Note = require('../models/Note'); 
const Student = require('../models/Student'); 

// 🔥 NEW UPLINK: Naye Faculty Routes ko import kiya
const facultyRoutes = require('./facultyRoutes');
// 🔥 NEW UPLINK: Naye Admin Routes ko import kiya (Jisme bulk-upload aur approve-faculty tha)
const adminRoutes = require('./adminRoutes'); // Make sure this file exists and is named adminRoutes.js

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

// 🔥 FIX: Removed assignFaculty and bulkUpload from mainController import 
// Kyunki wo ab adminController/facultyController mein handle ho rahe hain adminRoutes ke zariye.
const { 
    registerFaculty, 
    createLecture, 
    getFaculties, 
    importExcelStudents
} = require('../controllers/mainController');

const { uploadNote } = require('../controllers/noteController');

// 🛡️ [ATTENDANCE_CONTROLLER_UPLINK]: Strictly Imported
const { 
    startAttendanceSession, 
    markAttendance, 
    getAllStudentsForTable, 
    getFacultyRegisters,
    deleteMonthlyRegister,
    updateMonthlyRegister,
    getStudentPersonalLedger, 
    getAvailableSubjects,     
    enrollStudent,            
    getSessionStatus          
} = require('../controllers/attendanceController');


// ==========================================
// 🎓 STUDENT ROUTES
// ==========================================
router.get('/student/faculties', getFaculties);
router.post('/student/login', studentLogin);
router.post('/student/register', registerStudent);
router.post('/student/send-otp', sendRegistrationOTP);
router.get('/student/dashboard-info', protect, getDashboardInfo);
router.get('/student/verify/:regNo', getStudentByRegNo); 
router.post('/student/complete-profile', completeProfile);
router.post('/student/activate', activateStudentVault); 


// ==========================================
// 🛡️ ADMIN SPECIFIC ROUTES (That were cluttering this file)
// ==========================================
router.get('/admin/students', async (req, res) => {
    try {
        const students = await Student.find().sort({ registeredAt: -1 });
        res.json(students);
    } catch (err) {
        res.status(500).json({ success: false, message: "Vault Access Denied" });
    }
});
// ❌ Yahan se assignFaculty aur bulk-upload hata diye kyunki wo ab adminRoutes.js handle karega.
router.post('/admin/import-excel', upload.single('excelFile'), importExcelStudents);

// ==========================================
// 📚 NOTES & MISC ROUTES
// ==========================================
router.post('/upload-note', upload.single('file'), uploadNote);
router.get('/notes/fetch-notes', async (req, res) => {
  try {
    const notes = await Note.find().sort({ uploadedAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: "Vault Fetch Failed" });
  }
});
router.post('/verify-download', (req, res) => res.json({ success: true })); 

// ==========================================
// 📊 ATTENDANCE ROUTES
// ==========================================
router.post('/attendance/start-session', startAttendanceSession);
router.post('/attendance/mark-me', markAttendance);
router.get('/attendance/all-students', getAllStudentsForTable);
router.get('/attendance/my-registers', getFacultyRegisters);
router.post('/attendance/delete-register', deleteMonthlyRegister);
router.post('/attendance/update-register', updateMonthlyRegister);
router.get('/attendance/personal-ledger', getStudentPersonalLedger);
router.get('/attendance/available-subjects', getAvailableSubjects);
router.post('/attendance/enroll-student', enrollStudent);
router.get('/attendance/session-status', getSessionStatus);


// ==========================================
// 🔌 MODULAR ROUTE MOUNTS (The Magic Connectors)
// ==========================================
// 🔥 Yahan tere baaki saare alag-alag files judenge

// Yeh line ensure karegi ki frontend jo /api/faculty/request-access bhej raha hai wo theek jagah jaye
router.use('/faculty', facultyRoutes);

// 🔥 NEW: Yeh line ensure karegi ki AdminDashboard se aane wali /api/admin/approve-faculty request fail na ho!
router.use('/admin', adminRoutes); 

module.exports = router;