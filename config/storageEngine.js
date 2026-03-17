/*   const cloudinary = require('cloudinary').v2;
     const multer = require('multer');

// Cloudinary Configuration
cloudinary.config({
  // 🔥 FIX: Value ki jagah variable ka naam use karo
  cloud_name: process.env.CLOUDINARY_NAME,       // Matches .env variable name
  api_key: process.env.CLOUDINARY_API_KEY,      // Corrected
  api_secret: process.env.CLOUDINARY_API_SECRET // Corrected
});

// Multer Storage - Memory mein rakhenge taaki clouds par bhej sakein
const storage = multer.memoryStorage();

// Strict Filter: Sirf PDF aur PPT
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf', 
    'application/vnd.ms-powerpoint', 
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Bhai! Sirf PDF aur PPT allow hai.'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // Strict 10MB Limit
});

module.exports = { cloudinary, upload };   */