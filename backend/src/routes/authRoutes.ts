import express from 'express';
import { syncUser } from '../controllers/authController';
import { verifyToken } from '../middleware/authMiddleware';

const router = express.Router();

// Endpoint: POST /api/auth/sync
// Frontend panggil ini setiap kali user baru buka aplikasi (setelah login)
router.post('/sync', verifyToken, syncUser);

export default router;