const express = require('express');
const router = express.Router();
const Note = require('../models/Note'); // Model import kiya fetch karne ke liye
const { uploadToCloudinary } = require('../controllers/noteController');
const { upload } = require('../config/storageEngine'); // Multer middleware

// --- FACULTY UPLINK ---
// POST: /api/upload-note
router.post('/upload-note', upload.single('file'), uploadToCloudinary);

// --- STUDENT DOWNLINK ---
// 🔥 [SYSTEM_AUTO_SYNC]: Fetch all notes for Student Dashboard
router.get('/fetch-notes', async (req, res) => {
  try {
    // Database se saare notes utha kar latest order mein dena
    const notes = await Note.find().sort({ uploadedAt: -1 }); 
    res.json(notes);
  } catch (err) {
    console.error("❌ [FETCH_ERROR]:", err);
    res.status(500).json({ error: "Vault access denied!" });
  }
});

module.exports = router;