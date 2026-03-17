// NEW: Models Import (Database blue-prints)
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
// NEW: Excel Parser Utility
const XLSX = require('xlsx');

// Dummy Data Store (Preserved for internal logic consistency)
let facultyList = [];
let studentList = [];
let lectureVault = [];

// 1. ADMIN: Register Faculty
const registerFaculty = async (req, res) => {
    try {
        const facultyNode = new Faculty(req.body);
        await facultyNode.save();

        const faculty = { id: Date.now(), ...req.body, lectures: [] };
        facultyList.push(faculty);
        console.log("Faculty Node Registered:", faculty.facultyName || faculty.name);
        res.status(201).json({ success: true, message: "SUCCESS: Node Authorized", faculty });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// 2. FACULTY: Create Lecture
const createLecture = async (req, res) => {
    try {
        const { facultyEmail, unit, date, topic, desc, time } = req.body;

        await Faculty.findOneAndUpdate(
            { emailID: facultyEmail },
            { $push: { lectures: { unit, date, topic, desc, time } } }
        );

        const lecture = { id: Date.now(), ...req.body };
        lectureVault.push(lecture);
        
        res.status(201).json({ success: true, message: "LECTURE_SYNCED", lecture });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// 3. STUDENT: Get Faculty List
const getFaculties = async (req, res) => {
    try {
        const dbFaculties = await Faculty.find();
        res.json(dbFaculties);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- UPDATED LOGIC: EXCEL BULK INGESTION (Aggressive Schema Mapping) ---
const importExcelStudents = async (req, res) => {
    try {
        let studentNodes = [];

        // 🔥 CASE 1: Data coming from Frontend Preview Table (Strictly handling new columns)
        if (req.body && req.body.students && Array.isArray(req.body.students)) {
            studentNodes = req.body.students.map(s => ({
                ...s,
                regNo: s.regNo || s.collegeId,
                name: s.name,
                year: String(s.year || '1'), // 🔥 YEAR is now strictly passed to DB
                course: s.course,
                semester: String(s.semester || '1'),
                section: String(s.section || 'A').toUpperCase(),
                email: s.email,
                phone: s.phone,
                password: s.password || "DEFAULT_LOCKED",
                isProfileCompleted: s.isProfileCompleted || false
            }));
        } 
        // 💾 CASE 2: Raw Excel Buffer Ingestion
        else if (req.file) {
            const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(sheet);

            studentNodes = data.map(row => {
                const rawId = row['Reg.No.'] || row['Reg. No.'] || row['Roll No'] || row['RegNo'] || row['regNo'];
                const idString = rawId ? String(rawId).trim() : null; 
                
                // Aggressive Key Search
                const sem = row['Semester'] || row['semester'] || '1';
                const yr = row['Year'] || row['year'] || '1'; // 🔥 YEAR handling added
                const sec = row['Section'] || row['section'] || row['Sec'] || row['sec'] || 'A';

                return {
                    regNo: idString, 
                    name: (row['Name'] || row['name'] || "UNKNOWN").toUpperCase(),
                    email: row['Email'] || row['email'] || (idString ? `${idString}@college.edu` : `temp_${Date.now()}@college.edu`),
                    password: "DEFAULT_LOCKED",
                    course: row['Class'] || row['Course'] || row['course'] || 'BCA', 
                    year: String(yr), // 🔥 Saving year
                    semester: String(sem), 
                    section: String(sec).toUpperCase(), 
                    phone: row['Phone'] || row['phone'] ? String(row['Phone'] || row['phone']) : '0000000000',
                    isProfileCompleted: false 
                };
            }).filter(node => node.regNo !== null);
        } else {
            return res.status(400).json({ success: false, message: "NO_DATA_PROVIDED" });
        }

        // 🛡️ PRE-INSERTION CLEANUP: Remove uncompleted duplicate ghost nodes
        const regNumbers = studentNodes.map(n => n.regNo);
        await Student.deleteMany({ regNo: { $in: regNumbers }, isProfileCompleted: false });

        // 🚀 BATCH UPLINK (Chunking for stability)
        const chunkSize = 5000;
        let insertedCount = 0;
        for (let i = 0; i < studentNodes.length; i += chunkSize) {
            const chunk = studentNodes.slice(i, i + chunkSize);
            try {
                const result = await Student.insertMany(chunk, { ordered: false });
                insertedCount += result.length;
            } catch (bulkError) {
                if(bulkError.insertedDocs) {
                   insertedCount += bulkError.insertedDocs.length;
                }
            }
        }

        console.log(`✨ [SYSTEM]: ${insertedCount} Student Entities Synced`);
        res.status(201).json({ success: true, message: `ARCHIVE_SYNC_COMPLETE: ${insertedCount} records added.` });

    } catch (error) {
        console.error("Archive Sync Error:", error);
        res.status(500).json({ success: false, message: "SYNC_FAILURE", error: error.message });
    }
};

// 🔥 MISSION 2: NEURAL LINK (FACULTY ASSIGNMENT)
const assignFaculty = async (req, res) => {
    try {
        const { facultyId, course, semester, section, subject } = req.body;
        const faculty = await Faculty.findById(facultyId);
        if (!faculty) return res.status(404).json({ success: false, message: "FACULTY_NODE_NOT_FOUND" });

        if (!faculty.assignedClasses) faculty.assignedClasses = [];

        const isDuplicate = faculty.assignedClasses.some(c => 
            c.course === course && c.semester === semester && c.section === section && c.subject.toUpperCase() === subject.toUpperCase()
        );

        if (isDuplicate) return res.status(400).json({ success: false, message: "LINK_ALREADY_EXISTS" });

        faculty.assignedClasses.push({ course, semester, section, subject: subject.toUpperCase() });
        
        if(!faculty.courses) faculty.courses = [];
        if(!faculty.courses.includes(course)) faculty.courses.push(course);

        await faculty.save();
        res.status(200).json({ success: true, message: "NEURAL_LINK_ESTABLISHED" });

    } catch (error) {
        res.status(500).json({ success: false, message: "LINK_CRITICAL_FAILURE", error: error.message });
    }
};

const bulkUploadStudents = importExcelStudents; 

module.exports = { 
    registerFaculty, 
    createLecture, 
    getFaculties, 
    importExcelStudents, 
    bulkUploadStudents,
    assignFaculty
};