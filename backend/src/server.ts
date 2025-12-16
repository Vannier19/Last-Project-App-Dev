import express from 'express';
import cors from 'cors';
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables first
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json()); // Supaya bisa baca JSON body

// Setup Firebase
import './config/firebase';

// Import Routes
import materialRoutes from './routes/materialRoutes';
import authRoutes from './routes/authRoutes';
import progressRoutes from './routes/progressRoutes';


const PORT = process.env.PORT || 3001;

// --- DAFTAR ROUTES ---
app.use('/api/materials', materialRoutes); // Semua URL diawali /api/materials
app.use('/api/auth', authRoutes);         // -> /api/auth/sync
app.use('/api/progress', progressRoutes); // -> /api/progress/quiz, dll

// Test Route
app.get('/', (req, res) => {
    res.json({ message: "Server Ready 🚀" });
});

app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});