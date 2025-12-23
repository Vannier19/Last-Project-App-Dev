import * as admin from 'firebase-admin';

let db: admin.firestore.Firestore;

try {
    if (!admin.apps.length) {
        // Initialize Firebase
        // This will automatically use Application Default Credentials (ADC) on Google Cloud
        // or service account from environment in local development
        admin.initializeApp();

        console.log('🔥 Firebase Connected');
    }

    db = admin.firestore();

} catch (error) {
    console.error("❌ Firebase Initialization Error:", error);
    db = {} as any;
}

export { admin, db };
