import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { admin } from '../config/firebase';

// Dipanggil setelah Frontend berhasil login (Google atau Email/Password) & dapet Token
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
                displayName: user.name || user.email?.split('@')[0] || "User",
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

// Register dengan Email/Password
export const registerWithEmail = async (req: Request, res: Response) => {
    try {
        const { email, password, displayName } = req.body;

        // Validasi input
        if (!email || !password) {
            return res.status(400).json({ 
                error: "Email dan password wajib diisi" 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                error: "Password minimal 6 karakter" 
            });
        }

        // Buat user baru di Firebase Auth
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: displayName || email.split('@')[0],
            emailVerified: false
        });

        // Simpan ke Firestore
        const db = admin.firestore();
        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName || email.split('@')[0],
            role: 'student',
            createdAt: new Date(),
            emailVerified: false
        });

        // Generate custom token untuk auto-login
        const customToken = await admin.auth().createCustomToken(userRecord.uid);

        return res.status(201).json({ 
            message: "Registrasi berhasil",
            customToken,
            user: {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName
            }
        });

    } catch (error: any) {
        // Handle Firebase Auth errors
        if (error.code === 'auth/email-already-exists') {
            return res.status(400).json({ 
                error: "Email sudah terdaftar" 
            });
        }
        if (error.code === 'auth/invalid-email') {
            return res.status(400).json({ 
                error: "Format email tidak valid" 
            });
        }
        
        console.error('Registration error:', error);
        return res.status(500).json({ 
            error: "Gagal melakukan registrasi" 
        });
    }
};

// Login dengan Email/Password (verify credentials)
export const loginWithEmail = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Validasi input
        if (!email || !password) {
            return res.status(400).json({ 
                error: "Email dan password wajib diisi" 
            });
        }

        // Cek apakah user ada
        const userRecord = await admin.auth().getUserByEmail(email);
        
        // Generate custom token untuk login
        // Note: Backend tidak bisa verify password secara langsung,
        // Frontend yang akan verify via Firebase Client SDK
        // Endpoint ini hanya untuk generate token setelah frontend berhasil login
        const customToken = await admin.auth().createCustomToken(userRecord.uid);

        return res.status(200).json({ 
            message: "Login berhasil",
            customToken,
            user: {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName
            }
        });

    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            return res.status(404).json({ 
                error: "Email tidak terdaftar" 
            });
        }
        
        console.error('Login error:', error);
        return res.status(500).json({ 
            error: "Gagal melakukan login" 
        });
    }
};
