// backend/src/controllers/materialController.ts
import { Request, Response } from 'express';
import { admin } from '../config/firebase';

// GET: Ambil semua materi untuk Sidebar
export const getAllMaterials = async (req: Request, res: Response) => {
    try {
        const db = admin.firestore();
        const snapshot = await db.collection('materials').orderBy('order').get();
        const materials = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(materials);
    } catch (error) {
        res.status(500).json({ error: "Gagal mengambil data materi" });
    }
};

// POST: Tambah materi baru (Hanya Admin nanti)
export const createMaterial = async (req: Request, res: Response) => {
    try {
        const db = admin.firestore();
        const { title, content, order } = req.body;
        const newDoc = await db.collection('materials').add({
            title,
            content,
            order,
            createdAt: new Date()
        });
        res.status(201).json({ id: newDoc.id, message: "Materi berhasil dibuat" });
    } catch (error) {
        res.status(500).json({ error: "Gagal membuat materi" });
    }
};
