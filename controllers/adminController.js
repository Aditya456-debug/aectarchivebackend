const Student = require('../models/Student');
const Faculty = require('../models/Faculty'); 
const XLSX = require('xlsx'); // 🔥 CSV ki jagah XLSX use karenge reliability ke liye

const bulkUploadStudents = async (req, res) => {
    try {
        console.log("🚀 [SYSTEM]: Uplink Received. Processing Excel Binary...");
        
        // 🛡️ Safe check for file
        if (!req.file) return res.status(400).json({ success: false, msg: "NO_FILE" });

        // 📖 Read Excel from Buffer (Memory Storage)
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (rawData.length === 0) {
            return res.status(400).json({ success: false, msg: "FILE_IS_EMPTY" });
        }

        const results = rawData.map((row) => {
            // 🧠 BACKEND AUTO-CORRECT: Dhoondo headers ko intelligently
            const rNo = row['RegNo'] || row['regno'] || row['Roll No'] || row['RollNo'] || row['Reg.No.'] || row['id'];
            const sName = row['Name'] || row['name'] || row['Student Name'] || row['StudentName'] || "UNKNOWN";
            const sClass = row['Course'] || row['course'] || row['Class'] || row['class'] || "B.TECH";

            if (rNo) {
                return {
                    regNo: String(rNo).trim(),
                    collegeId: String(rNo).trim(),
                    name: String(sName).toUpperCase().trim(),
                    email: row['Email'] || row['email'] || `${rNo}@acet.edu`,
                    password: "DEFAULT_LOCKED", 
                    course: String(sClass).toUpperCase().trim(),
                    phone: String(row['Phone'] || row['phone'] || '0000000000').trim(),
                    isProfileCompleted: false
                };
            }
            return null;
        }).filter(item => item !== null); // 🛡️ Drop invalid rows

        if (results.length === 0) {
            return res.status(400).json({ success: false, msg: "HEADER_MISMATCH_OR_NO_DATA" });
        }

        // 💾 Bulk Insert to Vault
        // ordered: false taaki agar ek record duplicate ho toh baaki stop na hon
        await Student.insertMany(results, { ordered: false });

        console.log(`✅ [DATABASE]: ${results.length} Nodes Synced to Vault`);
        res.json({ success: true, msg: `${results.length} Students Synced Successfully!` });

    } catch (err) {
        // Mongoose 11000 error (Duplicate) ko handle karne ke liye
        if (err.code === 11000) {
            return res.json({ success: true, msg: "Partial Sync: New nodes added, duplicates ignored." });
        }
        console.error("🔥 [CRITICAL]:", err);
        res.status(500).json({ success: false, msg: "UPLINK_INTERNAL_FAILURE", detail: err.message });
    }
};

// 🔥 NEW ZERO-TRUST: Approve Pending Faculty Request
const approveFaculty = async (req, res) => {
    try {
        const { id } = req.body;
        const faculty = await Faculty.findById(id);
        if (!faculty) return res.status(404).json({ success: false, msg: "NODE_NOT_FOUND" });

        const randomCode = Math.floor(1000 + Math.random() * 9000);
        const newFacultyID = `FAC-${randomCode}`;

        faculty.facultyID = newFacultyID;
        faculty.isAdminApproved = true;
        await faculty.save();

        console.log(`✅ [SYSTEM]: Access Granted to ${faculty.facultyName}`);
        res.json({ success: true, msg: "ACCESS_GRANTED", facultyID: newFacultyID });

    } catch (error) {
        console.error("❌ [APPROVAL_ERROR]:", error);
        res.status(500).json({ success: false, msg: "Server Error" });
    }
};

module.exports = { bulkUploadStudents, approveFaculty };