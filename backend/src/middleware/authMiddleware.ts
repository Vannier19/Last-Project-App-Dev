// backend/src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

// Kita extend tipe Request express supaya bisa nyimpen data user
export interface AuthRequest extends Request {
    user?: admin.auth.DecodedIdToken;
}

export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1]; // Format: "Bearer <token>"

    if (!token) {
        return res.status(401).json({ message: "Akses ditolak. Token tidak ada." });
    }

    try {
        const decodedValue = await admin.auth().verifyIdToken(token);
        req.user = decodedValue; // Simpan data user di request
        next(); // Lanjut ke controller
    } catch (e) {
        return res.status(403).json({ message: "Token tidak valid atau kadaluarsa." });
    }
};