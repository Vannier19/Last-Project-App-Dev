// backend/src/routes/materialRoutes.ts
import express from 'express';
import { getAllMaterials, createMaterial } from '../controllers/materialController';
import { verifyToken } from '../middleware/authMiddleware';

const router = express.Router();

// Public: Bisa diakses siapa saja tanpa login
router.get('/', getAllMaterials); 

// Private: Admin only (nanti bisa tambah cek role)
router.post('/', verifyToken, createMaterial);

export default router;