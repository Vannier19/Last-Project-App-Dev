import express from 'express';
import { getUserProgress, completeMaterial, submitQuizScore, updateLabStatus } from '../controllers/progressController';
import { verifyToken } from '../middleware/authMiddleware';

const router = express.Router();

// Semua route ini butuh login (verifyToken)
router.get('/', verifyToken, getUserProgress); // Ambil semua progress
router.post('/material', verifyToken, completeMaterial); // Selesai baca materi
router.post('/quiz', verifyToken, submitQuizScore); // Submit nilai kuis
router.post('/lab', verifyToken, updateLabStatus); // Update status lab

export default router;