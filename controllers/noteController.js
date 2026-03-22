const Note = require('../models/Note');
// utils se Telegram engine bula rahe hain
const { uploadToTelegram } = require('../utils/telegramUploader'); 

// 🔥 NAAM CHANGED: uploadToCloudinary -> uploadNote
const uploadNote = async (req, res) => {
  try {
    // 1. File availability check (Strictly No Changes)
    if (!req.file) {
      console.error("❌ [ERROR]: req.file is missing!");
      return res.status(400).json({ error: "File gayab hai bhai!" });
    }

    // 2. Uploading to Telegram (Using buffer logic)
    const fileName = req.file.originalname || "Untitled_Note.pdf";
    
    try {
      const result = await uploadToTelegram(req.file.buffer, fileName);
      
      // 🔥 YOUR ORIGINAL LOGIC: MongoDB mein Entry (With Newly Added Fields from Frontend)
      const newNote = new Note({
        title: req.body.title || "Untitled_Note",
        // 🔥 FIX: Added these two fields so Student Dashboard can filter properly
        subject: req.body.subject || "General",
        faculty: req.body.facultyEmail || "Admin",
        fileUrl: result.secure_url, 
        publicId: result.public_id, 
        category: req.body.category || "Notes"
      });

      await newNote.save(); 

      res.json({ 
        success: true, 
        url: result.secure_url, 
        msg: "SYNC_SUCCESS: File is in Vault & Database!" 
      });
    } catch (error) {
      console.error("❌ [UPLOAD ERROR]:", error);
      return res.status(500).json({ error: "Upload Failed!" });
    }

  } catch (err) {
    console.error("❌ [SYSTEM CRASH]:", err);
    res.status(500).json({ error: "System Crash!" });
  }
};

// 🔥 EXPORT UPDATED
module.exports = { uploadNote };