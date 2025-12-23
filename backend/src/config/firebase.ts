import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config();

let db: admin.firestore.Firestore;

try {
    if (!admin.apps.length) {
        // Initialize Firebase
        // This will automatically use GOOGLE_APPLICATION_CREDENTIALS from .env
        // or Default Application Credentials (ADC) on Google Cloud
        admin.initializeApp();

        console.log('🔥 Firebase Connected');
    }

    db = admin.firestore();

} catch (error) {
    console.error("❌ Firebase Initialization Error:", error);
    db = {} as any;
}

export { admin, db };
