const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
    title: { type: String, required: true },
    fileUrl: { type: String, required: true },
    publicId: { type: String, required: true },
    category: { 
        type: String, 
        required: true,
        // UPDATED: In sabhi categories ko allow kar diya hai
        enum: ['Notes', 'PYQ', 'Assignments', 'Archive_Notes', 'PYQ_Archives', 'Assignments', 'Subject_Archives'] 
    },
    uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Note', NoteSchema);