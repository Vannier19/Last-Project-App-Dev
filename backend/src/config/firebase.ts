import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Initialize Firebase
// Note: This expects serviceAccountKey.json in the src directory
const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');

let db: admin.firestore.Firestore;

try {
    // Check if app is already initialized
    if (!admin.apps.length) {
        // Only try to require the key file if we are initializing
        // This prevents crash if file is missing but we want to handle it gracefully in logs
        if (require('fs').existsSync(serviceAccountPath)) {
            const serviceAccount = require(serviceAccountPath);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log('🔥 Firebase Connected');
        } else {
            console.error('❌ Firebase Error: serviceAccountKey.json not found at ' + serviceAccountPath);
            // We initialize with default credentials (e.g. env vars) or just don't init
            // If we don't init, db assignment below will fail or we should handle it
            console.warn('⚠️  For local development, ensure you have serviceAccountKey.json in backend/src');
        }
    }

    if (admin.apps.length) {
        db = admin.firestore();
    } else {
        // Fallback or throw?
        // If we throw here, we crash. If we don't, db is undefined and usage will crash.
        // Better to crash early with clear message?
        // Or create a dummy db object that throws on usage?
        // Let's just log error and let it crash later if used, or throw now.
        throw new Error('Firebase Application invalid or could not be initialized (missing key?)');
    }

} catch (error) {
    console.error("❌ Firebase Initialization Error:", error);
    // Ensure db is defined to prevent "cannot read property of undefined" immediate crashes at import time,
    // although it will crash at usage time.
    // Casting to any to avoid strict typing issues here if we accept it might fail
    db = {} as any;
}

export { admin, db };
