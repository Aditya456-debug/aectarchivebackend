const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); 
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') }); 
const allRoutes = require('./routes/allRoutes');

const app = express(); 
const PORT = process.env.PORT || 5000;

console.log("✨ [DEBUG]: Core Directory:", __dirname);

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/cyber_nexus";

mongoose.connect(MONGO_URI)
    .then(() => console.log("✨ [SYSTEM]: MongoDB Data-Link Established"))
    .catch((err) => console.log("❌ [SYSTEM]: Connection Failed", err));

// 🔥 STICKLY UPDATED: CORS fixed for Mobile & Browser strict rules
app.use(cors({
    origin: true, // FIX: Dynamic origin allow karta hai bina strict policy break kiye
    credentials: true
}));

// 🔥 FIX: Standard express.json() limit (Excel aur file uploads ke liye perfect)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api', allRoutes);

app.get('/', (req, res) => {
    res.send("Cyber-Nexus Backend is LIVE and Organized");
});

// 🔥 STICKLY UPDATED: Binding to 0.0.0.0 for Network Visibility
app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SYSTEM]: Core Uplink established on Network Port ${PORT}`);
    console.log(`🚀 Mobile Access: http://192.168.1.3:${PORT}`);
});