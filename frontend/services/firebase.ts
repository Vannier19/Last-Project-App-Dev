// Firebase Configuration untuk Frontend
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  User,
  Auth
} from 'firebase/auth';
// @ts-ignore - React Native specific import
import { getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Firebase Config dari Environment Variables
// Pastikan sudah setting di .env file
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Platform-specific auth initialization
let auth: Auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  // React Native: use initializeAuth with AsyncStorage persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

// Auth Functions
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    return { user: userCredential.user, token };
  } catch (error: any) {
    // Log error untuk debugging
    console.log('🔍 Firebase signIn error:', JSON.stringify(error, null, 2));
    console.log('🔍 Error code:', error.code);
    console.log('🔍 Error message:', error.message);
    
    // Provide user-friendly error messages
    let errorMessage = 'Login gagal';
    
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
      errorMessage = '❌ Email atau password salah';
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = '❌ Email tidak terdaftar. Silakan register terlebih dahulu.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = '❌ Format email tidak valid. Contoh: nama@email.com';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = '⏳ Terlalu banyak percobaan. Coba lagi dalam beberapa saat.';
    } else if (error.message) {
      // Parse Firebase error message
      if (error.message.includes('invalid-credential') || error.message.includes('wrong-password')) {
        errorMessage = '❌ Email atau password salah';
      } else if (error.message.includes('user-not-found')) {
        errorMessage = '❌ Email tidak terdaftar. Silakan register terlebih dahulu.';
      } else if (error.message.includes('invalid-email') || error.message.includes('INVALID_EMAIL')) {
        errorMessage = '❌ Format email tidak valid. Contoh: nama@email.com';
      } else {
        errorMessage = `❌ ${error.message}`;
      }
    }
    
    console.log('🔍 Final error message:', errorMessage);
    throw new Error(errorMessage);
  }
};

export const signUp = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    return { user: userCredential.user, token };
  } catch (error: any) {
    // Log error untuk debugging
    console.log('🔍 Firebase signUp error:', JSON.stringify(error, null, 2));
    console.log('🔍 Error code:', error.code);
    console.log('🔍 Error message:', error.message);
    
    // Provide user-friendly error messages
    let errorMessage = 'Registrasi gagal';
    
    // Handle Firebase error response format
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = '❌ Email sudah terdaftar. Silakan gunakan email lain atau login.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = '❌ Format email tidak valid';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = '❌ Password terlalu lemah. Minimal 6 karakter';
    } else if (error.customData?.message === 'EMAIL_EXISTS') {
      errorMessage = '❌ Email sudah terdaftar. Silakan gunakan email lain atau login.';
    } else if (error.customData?.message === 'INVALID_EMAIL') {
      errorMessage = '❌ Format email tidak valid. Contoh: nama@email.com';
    } else if (error.message) {
      // Parse Firebase error message
      if (error.message.includes('EMAIL_EXISTS') || error.message.includes('email-already-in-use')) {
        errorMessage = '❌ Email sudah terdaftar. Silakan gunakan email lain atau login.';
      } else if (error.message.includes('INVALID_EMAIL') || error.message.includes('invalid-email')) {
        errorMessage = '❌ Format email tidak valid. Contoh: nama@email.com';
      } else if (error.message.includes('WEAK_PASSWORD') || error.message.includes('weak-password')) {
        errorMessage = '❌ Password terlalu lemah. Minimal 6 karakter';
      } else {
        errorMessage = `❌ ${error.message}`;
      }
    }
    
    console.log('🔍 Final error message:', errorMessage);
    throw new Error(errorMessage);
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    throw new Error(error.message || 'Sign out failed');
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export { auth, GoogleAuthProvider, signInWithCredential, signInWithPopup };
export default app;
