import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { db, admin } from '../config/firebase';

// 1. GET: Ambil Progress User Saat Ini
export const getUserProgress = async (req: AuthRequest, res: Response) => {
    try {
        const uid = req.user?.uid; // Didapat dari middleware verifyToken
        if (!uid) return res.status(401).json({ message: "User tidak teridentifikasi" });

        const docRef = db.collection('progress').doc(uid);
        const doc = await docRef.get();

        if (!doc.exists) {
            // Jika belum ada progress, kembalikan data kosong
            return res.status(200).json({
                userId: uid,
                completedMaterials: [],
                quizScores: {},
                labStatus: {}
            });
        }

        res.status(200).json(doc.data());
    } catch (error) {
        res.status(500).json({ error: "Gagal mengambil progress" });
    }
};

// 2. POST: Tandai Materi Selesai
export const completeMaterial = async (req: AuthRequest, res: Response) => {
    try {
        const uid = req.user?.uid;
        const { materialId } = req.body;
        if (!uid) return res.status(401).json({ message: "Unauthorized" });

        const docRef = db.collection('progress').doc(uid);

        // Gunakan arrayUnion agar tidak duplikat
        await docRef.set({
            userId: uid,
            completedMaterials: admin.firestore.FieldValue.arrayUnion(materialId),
            lastUpdated: new Date()
        }, { merge: true }); // Merge: jangan timpa data lain (kuis/lab)

        res.status(200).json({ message: "Materi selesai!" });
    } catch (error) {
        res.status(500).json({ error: "Gagal update materi" });
    }
};

// 3. POST: Simpan Skor Kuis
export const submitQuizScore = async (req: AuthRequest, res: Response) => {
    try {
        const uid = req.user?.uid;
        const { quizId, score } = req.body; // Score misal: 80
        if (!uid) return res.status(401).json({ message: "Unauthorized" });

        const docRef = db.collection('progress').doc(uid);

        // Update field specific di dalam object quizScores
        // Syntax: "quizScores.ID_KUIS": NILAI
        await docRef.set({
            userId: uid,
            [`quizScores.${quizId}`]: score,
            lastUpdated: new Date()
        }, { merge: true });

        res.status(200).json({ message: "Nilai kuis tersimpan!" });
    } catch (error) {
        res.status(500).json({ error: "Gagal simpan kuis" });
    }
};

// 4. POST: Update Status Lab
export const updateLabStatus = async (req: AuthRequest, res: Response) => {
    try {
        const uid = req.user?.uid;
        const { labId, status } = req.body; // status: 'in-progress' | 'completed'
        if (!uid) return res.status(401).json({ message: "Unauthorized" });

        const docRef = db.collection('progress').doc(uid);

        await docRef.set({
            userId: uid,
            [`labStatus.${labId}`]: status,
            lastUpdated: new Date()
        }, { merge: true });

        res.status(200).json({ message: "Status Lab diperbarui!" });
    } catch (error) {
        res.status(500).json({ error: "Gagal update lab" });
    }
};