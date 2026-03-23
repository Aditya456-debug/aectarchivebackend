const express = require('express');
const router = express.Router();

// 🔥 DONO CONTROLLERS IMPORT KARO
const adminCtrl = require('../controllers/adminController');
const mainCtrl = require('../controllers/mainController'); // 👈 assignFaculty yahan se aayega!
const multer = require('multer'); 

const upload = multer({ dest: 'uploads/' });

// Jab koi POST request bheje register karne ke liye
router.post('/register-faculty', mainCtrl.registerFaculty); // 🔥 Changed to mainCtrl

// Jab Admin dashboard load ho aur saari faculties dekhni hon
router.get('/faculties', mainCtrl.getFaculties); // 🔥 Changed to mainCtrl.getFaculties

// 🔥 NEW: Massive Student Data Upload Route
router.post('/bulk-upload', upload.single('file'), adminCtrl.bulkUploadStudents);

// 🔥 MISSION 2: Neural Link (Faculty Assignment) Route
router.post('/assign-faculty', mainCtrl.assignFaculty); // 🔥 Changed to mainCtrl

// 🔥 NEW ZERO-TRUST: Approve Pending Faculty Request from Admin Dashboard
router.post('/approve-faculty', adminCtrl.approveFaculty);

module.exports = router;