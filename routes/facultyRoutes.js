const express = require('express');
const router = express.Router();

// Controllers ko import kar rahe hain
const { 
    adminCreateFaculty, 
    verifyFacultyId, 
    completeFacultyProfile, 
    facultyLogin,
    getFacultyProfile, // 🔥 Added for Mission: Faculty Resonance
    createLecture,
    requestAccess // 🔥 NEW: Added for Zero-Trust Registration
} = require('../controllers/facultyController');

// Faculty Model ko yahan termination ke liye import kiya
const Faculty = require('../models/Faculty');

// ==========================================
// 🛡️ ADMIN CORE ROUTE (To Generate FAC-XXXX)
// ==========================================
router.post('/admin-create', adminCreateFaculty);

// ==========================================
// 🗑️ PERMANENT TERMINATION ROUTE (MongoDB Purge)
// ==========================================
router.delete('/terminate/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // MongoDB se document delete kar rahe hain
        const deletedNode = await Faculty.findByIdAndDelete(id);

        if (!deletedNode) {
            return res.status(404).json({ success: false, msg: "NODE_NOT_FOUND" });
        }

        res.json({ success: true, msg: "NODE_PURGED_FROM_DATABASE" });
    } catch (err) {
        console.error("❌ [TERMINATE_ERROR]:", err);
        res.status(500).json({ success: false, msg: "TERMINATION_FAILED" });
    }
});

// ==========================================
// 🔥 THE SECURE FACULTY UPLINK ROUTES
// ==========================================

// 1. Admin assigned ID check karne ke liye (Prefill)
router.post('/verify-id', verifyFacultyId);

// 2. Naya password, email, aur courses set karke Vault lock karne ke liye
router.post('/complete-profile', completeFacultyProfile);

// 3. Faculty Dashboard mein ghusne ke liye (Login)
router.post('/login', facultyLogin);

// 4. Faculty Profile aur assigned classes fetch karne ke liye
router.get('/profile/:email', getFacultyProfile); // 🔥 Added for Mission: Faculty Resonance

// 5. Zero-Trust Access Request from Faculty to Admin
router.post('/request-access', requestAccess); // 🔥 NEW: Faculty requests access, pending admin approval

// ==========================================
// 📚 LECTURE & VAULT ROUTES (Purana System Maintained)
// ==========================================
router.post('/create-lecture', createLecture); 

module.exports = router;