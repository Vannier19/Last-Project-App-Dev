import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// Firebase Functions/Cloud Run automatically provides credentials
// No need to manually load serviceAccountKey.json

let db: admin.firestore.Firestore;

try {
    // Check if app is already initialized to prevent 'app-already-exists' error
    if (!admin.apps.length) {
        // Initialize without credentials - uses Application Default Credentials
        admin.initializeApp();
        console.log('✅ Firebase Admin SDK initialized successfully');
    }

    // Get Firestore instance
    db = admin.firestore();

} catch (error) {
    console.error("❌ Firebase Initialization Error:", error);
    // Ensure db is defined to prevent "cannot read property of undefined" immediate crashes at import time,
    // although it will crash at usage time.
    // Casting to any to avoid strict typing issues here if we accept it might fail
    db = {} as any;
}

export { admin, db };
