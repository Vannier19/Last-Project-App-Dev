// Firebase Direct API Service (No Express Backend Required)
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  arrayUnion
} from 'firebase/firestore';
import app, { auth } from './firebase';

// Initialize Firestore
const db = getFirestore(app);

interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

class FirebaseApiService {
  // Auth: Sync user to Firestore
  async syncUser(token: string): Promise<ApiResponse> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // Create new user document
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          role: 'student',
          createdAt: new Date().toISOString(),
          progress: {
            completedMaterials: [],
            quizScores: {},
            labStatus: {}
          }
        });
      }

      return { message: 'User synced successfully' };
    } catch (error: any) {
      console.error('Sync user error:', error);
      throw error;
    }
  }

  // Materials: Get all materials
  async getMaterials(): Promise<ApiResponse> {
    try {
      const materialsRef = collection(db, 'materials');
      const snapshot = await getDocs(materialsRef);

      const materials = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { data: materials };
    } catch (error: any) {
      console.error('Get materials error:', error);
      throw error;
    }
  }

  // Materials: Get material by ID
  async getMaterialById(id: string): Promise<ApiResponse> {
    try {
      const materialRef = doc(db, 'materials', id);
      const materialDoc = await getDoc(materialRef);

      if (!materialDoc.exists()) {
        throw new Error('Material not found');
      }

      return { data: { id: materialDoc.id, ...materialDoc.data() } };
    } catch (error: any) {
      console.error('Get material error:', error);
      throw error;
    }
  }

  // Progress: Save quiz progress
  async saveQuizProgress(data: {
    materialId: string;
    score: number;
    answers: any[];
  }): Promise<ApiResponse> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      const userRef = doc(db, 'users', user.uid);

      await updateDoc(userRef, {
        [`progress.quizScores.${data.materialId}`]: data.score,
        'progress.completedMaterials': arrayUnion(data.materialId)
      });

      return { message: 'Progress saved successfully' };
    } catch (error: any) {
      console.error('Save progress error:', error);
      throw error;
    }
  }

  // Progress: Get user progress
  async getProgress(): Promise<ApiResponse> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return { data: { completedMaterials: [], quizScores: {}, labStatus: {} } };
      }

      const userData = userDoc.data();
      return { data: userData.progress || { completedMaterials: [], quizScores: {}, labStatus: {} } };
    } catch (error: any) {
      console.error('Get progress error:', error);
      throw error;
    }
  }

  // Helper: Set token (for compatibility, not needed with Firebase)
  setToken(token: string) {
    // Not needed with Firebase - auth is handled automatically
  }

  clearToken() {
    // Not needed with Firebase
  }
}

export const api = new FirebaseApiService();
export default api;
