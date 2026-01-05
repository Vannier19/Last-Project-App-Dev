import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { admin } from '../config/firebase';

// 1. GET: Ambil Progress User Saat Ini
export const getUserProgress = async (req: AuthRequest, res: Response) => {
    try {
        const db = admin.firestore();
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
                quizResults: {},
                labStatus: {}
            });
        }

        return res.status(200).json(doc.data());
    } catch (error) {
        return res.status(500).json({ error: "Gagal mengambil progress" });
    }
};

// 2. POST: Tandai Materi Selesai
export const completeMaterial = async (req: AuthRequest, res: Response) => {
    try {
        const db = admin.firestore();
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

        return res.status(200).json({ message: "Materi selesai!" });
    } catch (error) {
        return res.status(500).json({ error: "Gagal update materi" });
    }
};

// 3. POST: Simpan Skor Kuis dengan Detail Jawaban
export const submitQuizScore = async (req: AuthRequest, res: Response) => {
    try {
        const db = admin.firestore();
        const uid = req.user?.uid;
        const { quizId, score, totalQuestions, correctAnswers, answers } = req.body;

        if (!uid) return res.status(401).json({ message: "Unauthorized" });

        // Validasi input
        if (!quizId || score === undefined || !answers || !Array.isArray(answers)) {
            return res.status(400).json({
                error: "Data tidak lengkap. Kirim: quizId, score, totalQuestions, correctAnswers, answers[]"
            });
        }

        const docRef = db.collection('progress').doc(uid);
        const doc = await docRef.get();

        // If document doesn't exist, create it first with base structure
        if (!doc.exists) {
            await docRef.set({
                userId: uid,
                completedMaterials: [],
                quizScores: {},
                quizResults: {},
                labStatus: {},
                labHistory: {},
                lastUpdated: new Date()
            });
        }

        // Use update() which properly handles dot notation as nested paths
        const updateData: { [key: string]: any } = {
            [`quizScores.${quizId}`]: score,
            [`quizResults.${quizId}`]: {
                score: score,
                totalQuestions: totalQuestions || answers.length,
                correctAnswers: correctAnswers || answers.filter((a: any) => a.isCorrect).length,
                answers: answers,
                submittedAt: new Date()
            },
            lastUpdated: new Date()
        };

        await docRef.update(updateData);

        return res.status(200).json({
            message: "Nilai kuis tersimpan!",
            score: score,
            correctAnswers: correctAnswers || answers.filter((a: any) => a.isCorrect).length,
            totalQuestions: totalQuestions || answers.length
        });
    } catch (error) {
        console.error('Submit quiz error:', error);
        return res.status(500).json({ error: "Gagal simpan kuis" });
    }
};

// 4. POST: Update Status Lab (Extended with parameters for history)
export const updateLabStatus = async (req: AuthRequest, res: Response) => {
    try {
        const db = admin.firestore();
        const uid = req.user?.uid;
        const { labId, status, parameters } = req.body;
        if (!uid) return res.status(401).json({ message: "Unauthorized" });

        const docRef = db.collection('progress').doc(uid);
        const doc = await docRef.get();

        // If document doesn't exist, create it first with base structure
        if (!doc.exists) {
            await docRef.set({
                userId: uid,
                completedMaterials: [],
                quizScores: {},
                quizResults: {},
                labStatus: {},
                labHistory: {},
                lastUpdated: new Date()
            });
        }

        // Now use update() which properly handles dot notation as nested paths
        const updateData: { [key: string]: any } = {
            [`labStatus.${labId}`]: status,
            lastUpdated: new Date()
        };

        // If parameters provided, add to labHistory array
        if (parameters && status === 'completed') {
            const historyEntry = {
                ...parameters,
                completedAt: new Date()
            };
            updateData[`labHistory.${labId}`] = admin.firestore.FieldValue.arrayUnion(historyEntry);
        }

        await docRef.update(updateData);

        return res.status(200).json({ message: "Status Lab diperbarui!" });
    } catch (error) {
        console.error('Update lab status error:', error);
        return res.status(500).json({ error: "Gagal update lab" });
    }
};

