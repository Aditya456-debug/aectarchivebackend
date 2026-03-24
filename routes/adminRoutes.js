const express = require('express');
const router = express.Router();

// 🔥 DONO CONTROLLERS IMPORT KARO
const adminCtrl = require('../controllers/adminController');
const mainCtrl = require('../controllers/mainController'); 
const multer = require('multer'); 

// 🚀 UPGRADED MULTER CONFIGURATION
// Field size limit badha di hai taaki "Field value too long" error na aaye
const upload = multer({ 
    dest: 'uploads/',
    limits: {
        fieldSize: 25 * 1024 * 1024, // 25MB limit for text fields
        fileSize: 10 * 1024 * 1024   // 10MB limit for the Excel file itself
    }
});

// 🔥 MASTER ADMIN LOGIN ROUTE
router.post('/login', (req, res) => {
    const { email, pass } = req.body;
    
    if (email === "acetarchive@outlook.com" && pass === "Acet@123") {
        res.json({ success: true, token: "ADMIN_ACCESS_GRANTED" });
    } else {
        res.status(401).json({ success: false, message: "INVALID_CREDENTIALS" });
    }
});

// Jab koi POST request bheje register karne ke liye
router.post('/register-faculty', mainCtrl.registerFaculty); 

// Jab Admin dashboard load ho aur saari faculties dekhni hon
router.get('/faculties', mainCtrl.getFaculties); 

// 🔥 FIXED: Bulk Upload Route with Upgraded Limits
router.post('/bulk-upload', upload.single('file'), adminCtrl.bulkUploadStudents);

// 🔥 MISSION 2: Neural Link (Faculty Assignment) Route
router.post('/assign-faculty', mainCtrl.assignFaculty); 

// 🔥 NEW ZERO-TRUST: Approve Pending Faculty Request
router.post('/approve-faculty', adminCtrl.approveFaculty);

module.exports = router;