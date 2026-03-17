const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/adminController');
const multer = require('multer'); // 🔥 File upload handle karne ke liye

// Multer storage setup (Temporary folder for massive CSVs)
const upload = multer({ dest: 'uploads/' });

// Jab koi POST request bheje register karne ke liye (Untouched)
router.post('/register-faculty', adminCtrl.registerFaculty);

// Jab Admin dashboard load ho aur saari faculties dekhni hon (Untouched)
router.get('/faculties', adminCtrl.getAllFaculties);

// 🔥 NEW: Massive Student Data Upload Route
// Isme 'file' wahi key hai jo aap Postman/Frontend se bhejenge
router.post('/bulk-upload', upload.single('file'), adminCtrl.bulkUploadStudents);

// 🔥 MISSION 2: Neural Link (Faculty Assignment) Route
// Ye route professors ko specific batches/subjects assign karne ke liye hai
router.post('/assign-faculty', adminCtrl.assignFaculty);

module.exports = router;