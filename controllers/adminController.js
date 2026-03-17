const Student = require('../models/Student');
const csv = require('csv-parser');
const { Readable } = require('stream');

const bulkUploadStudents = async (req, res) => {
    try {
        console.log("🚀 [SYSTEM]: Uplink Received. Processing Stream...");
        if (!req.file) return res.status(400).json({ success: false, msg: "NO_FILE" });

        const results = [];
        const stream = Readable.from(req.file.buffer.toString());

        stream
            .pipe(csv())
            .on('data', (data) => {
                const cleanData = {};
                Object.keys(data).forEach(key => { cleanData[key.trim()] = data[key]; });

                // 🔥 Fix: Humne regNo variable dhoonda par use push nahi kiya tha
                const rNo = cleanData['Reg.No.'] || cleanData['RegNo'] || cleanData['Roll No'];
                
                if (rNo) {
                    results.push({
                        regNo: rNo,      // 👈 Yeh line zaroori hai schema pass karne ke liye
                        collegeId: rNo, 
                        name: cleanData['Name'] || "UNKNOWN",
                        email: cleanData['Email'] || `${rNo}@nexus.edu`,
                        password: "DEFAULT_LOCKED", 
                        course: cleanData['Class'] || "BCA",
                        phone: cleanData['Phone'] || '0000000000',
                        isProfileCompleted: false
                    });
                    console.log(`📖 [PARSING]: Found Node -> ${rNo}`);
                }
            })
            .on('end', async () => {
                try {
                    console.log(`📊 [SUMMARY]: Total Entities Parsed: ${results.length}`);
                    
                    if (results.length === 0) {
                        return res.status(400).json({ success: false, msg: "HEADER_MISMATCH_OR_EMPTY_FILE" });
                    }

                    // Bulk Insert to MongoDB
                    await Student.insertMany(results, { ordered: false });
                    console.log("✅ [DATABASE]: Nodes Successfully Synced to Vault");
                    
                    res.json({ success: true, msg: `${results.length} Students Synced!` });
                } catch (dbErr) {
                    console.error("❌ [DB_ERROR]:", dbErr.message);
                    res.status(500).json({ success: false, msg: "DATABASE_UPLINK_ERROR", error: dbErr.message });
                }
            });
    } catch (err) {
        console.error("🔥 [CRITICAL]:", err);
        res.status(500).json({ success: false, msg: "SERVER_INTERNAL_FAILURE" });
    }
};

module.exports = { bulkUploadStudents };