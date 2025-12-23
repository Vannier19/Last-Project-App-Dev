import express from 'express';
import { syncUser, registerWithEmail, loginWithEmail } from '../controllers/authController';
import { verifyToken } from '../middleware/authMiddleware';

const router = express.Router();

// Endpoint: POST /api/auth/sync
// Frontend panggil ini setiap kali user baru buka aplikasi (setelah login)
router.post('/sync', verifyToken, syncUser);

// Endpoint: POST /api/auth/register
// Register dengan email/password
router.post('/register', registerWithEmail);

// Endpoint: POST /api/auth/login
// Login dengan email/password (hanya untuk generate custom token)
// Actual password verification tetap di frontend menggunakan Firebase Client SDK
router.post('/login', loginWithEmail);

export default router;
