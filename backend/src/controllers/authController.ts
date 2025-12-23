import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { admin } from '../config/firebase';

// Dipanggil setelah Frontend berhasil login Google & dapet Token
export const syncUser = async (req: AuthRequest, res: Response) => {
    try {
        const db = admin.firestore();
        const user = req.user; // Dari token
        if (!user) return res.status(401).json({ message: "Token invalid" });

        const userRef = db.collection('users').doc(user.uid);
        const doc = await userRef.get();

        if (!doc.exists) {
            // User baru pertama kali login, simpan ke Firestore
            await userRef.set({
                uid: user.uid,
                email: user.email,
                displayName: user.name || "User",
                role: 'student', // Default role
                createdAt: new Date()
            });
            return res.status(201).json({ message: "User baru terdaftar" });
        }

        return res.status(200).json({ message: "User verified", role: doc.data()?.role });
    } catch (error) {
        return res.status(500).json({ error: "Gagal sinkronisasi user" });
    }
};
