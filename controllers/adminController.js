const Student = require('../models/Student');
const Faculty = require('../models/Faculty'); 
const XLSX = require('xlsx');
const fs = require('fs'); // 🔥 File system module to clean up after upload

const bulkUploadStudents = async (req, res) => {
    try {
        console.log("🚀 [SYSTEM]: Uplink Received. Processing Excel from Disk...");
        
        // 🛡️ Multer check (req.file.path use hoga buffer ki jagah)
        if (!req.file) return res.status(400).json({ success: false, msg: "NO_FILE" });

        // 📖 Read Excel from the path where Multer saved it
        const workbook = XLSX.readFile(req.file.path); 
        const sheetName = workbook.SheetNames[0];
        const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (rawData.length === 0) {
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); // Clean up
            return res.status(400).json({ success: false, msg: "FILE_IS_EMPTY" });
        }

        const results = rawData.map((row) => {
            // 🧠 BACKEND AUTO-CORRECT Logic
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
        }).filter(item => item !== null);

        if (results.length === 0) {
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(400).json({ success: false, msg: "INVALID_STRUCTURE" });
        }

        // 💾 Bulk Insert
        await Student.insertMany(results, { ordered: false });

        // 🧹 Cleanup: Delete temporary file from uploads folder
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        console.log(`✅ [DATABASE]: ${results.length} Nodes Synced`);
        res.json({ success: true, msg: `${results.length} Students Synced Successfully!` });

    } catch (err) {
        // Cleanup on error
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        
        if (err.code === 11000) {
            return res.json({ success: true, msg: "Partial Sync: New nodes added, duplicates ignored." });
        }
        console.error("🔥 [CRITICAL]:", err);
        res.status(500).json({ success: false, msg: "UPLINK_FAILURE", detail: err.message });
    }
};

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

        res.json({ success: true, msg: "ACCESS_GRANTED", facultyID: newFacultyID });
    } catch (error) {
        res.status(500).json({ success: false, msg: "Server Error" });
    }
};

module.exports = { bulkUploadStudents, approveFaculty };