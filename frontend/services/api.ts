// Hybrid API Service: Firebase Auth (direct) + Express Backend (data operations)
import { auth } from './firebase';
import { Alert } from 'react-native';

// API Base URL - Firebase Functions (production) or localhost (development)
// PRODUCTION URL: Menggunakan Cloud Run deployment
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api-7fvjncx4sq-uc.a.run.app';

// Validasi API URL saat startup
if (!API_BASE_URL) {
  console.error('❌ CRITICAL: API_BASE_URL is undefined!');
  Alert.alert('Configuration Error', 'API URL tidak ditemukan. Silakan hubungi administrator.');
} else if (!API_BASE_URL.startsWith('https://')) {
  console.warn('⚠️ WARNING: API URL tidak menggunakan HTTPS:', API_BASE_URL);
}

console.log('🔗 API Base URL:', API_BASE_URL);

interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

// Helper: Get Firebase ID token for authenticated requests
// Helper: Get Firebase ID token for authenticated requests
async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (user) return await user.getIdToken();

  // If no user immediately available, wait for auth initialization (useful for page reloads on web)
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      unsubscribe();
      if (user) {
        resolve(await user.getIdToken());
      } else {
        resolve(null);
      }
    });
  });
}

// Helper: Make authenticated API request
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = await getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'API request failed');
  }

  return { data };
}

class HybridApiService {
  // Auth: Sync user to backend (creates/updates user in Firestore via Express)
  async syncUser(_token?: string): Promise<ApiResponse> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      const response = await apiRequest('/api/auth/sync', {
        method: 'POST',
      });

      return { message: 'User synced successfully', ...response };
    } catch (error: any) {
      console.error('Sync user error:', error);
      throw error;
    }
  }

  // Materials: Get all materials via Express backend
  async getMaterials(): Promise<ApiResponse> {
    try {
      const response = await apiRequest('/api/materials');
      return response;
    } catch (error: any) {
      console.error('Get materials error:', error);
      throw error;
    }
  }

  // Materials: Get material by ID (uses materials list for now)
  async getMaterialById(id: string): Promise<ApiResponse> {
    try {
      // Backend doesn't have single material endpoint yet, so get all and filter
      const response = await this.getMaterials();
      const materials = response.data || [];
      const material = materials.find((m: any) => m.id === id);

      if (!material) {
        throw new Error('Material not found');
      }

      return { data: material };
    } catch (error: any) {
      console.error('Get material error:', error);
      throw error;
    }
  }

  // Progress: Save quiz score with detailed answers via Express backend
  async saveQuizProgress(data: {
    materialId: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    answers: Array<{
      questionNumber: number;
      question: string;
      userAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
    }>;
  }): Promise<ApiResponse> {
    try {
      const response = await apiRequest('/api/progress/quiz', {
        method: 'POST',
        body: JSON.stringify({
          quizId: data.materialId,
          score: data.score,
          totalQuestions: data.totalQuestions,
          correctAnswers: data.correctAnswers,
          answers: data.answers,
        }),
      });

      return { message: 'Progress saved successfully', ...response };
    } catch (error: any) {
      console.error('Save progress error:', error);
      throw error;
    }
  }

  // Progress: Get user progress via Express backend
  async getProgress(): Promise<ApiResponse> {
    try {
      const response = await apiRequest('/api/progress');

      // Transform backend response to match expected format
      const backendData = (response.data || {}) as {
        completedMaterials?: string[];
        quizScores?: Record<string, number>;
        quizResults?: Record<string, any>;
        labStatus?: Record<string, string>;
        labHistory?: Record<string, any[]>;
      };
      const formattedData = {
        completedMaterials: backendData.completedMaterials || [],
        quizScores: backendData.quizScores || {},
        quizResults: backendData.quizResults || {},
        labStatus: backendData.labStatus || {},
        labHistory: backendData.labHistory || {},
      };

      return { data: formattedData };
    } catch (error: any) {
      console.error('Get progress error:', error);
      // Return empty progress on error (user might be new or not logged in)
      return { data: { completedMaterials: [], quizScores: {}, quizResults: {}, labStatus: {}, labHistory: {} } };
    }
  }

  // Progress: Mark material as completed
  async completeMaterial(materialId: string): Promise<ApiResponse> {
    try {
      const response = await apiRequest('/api/progress/material', {
        method: 'POST',
        body: JSON.stringify({ materialId }),
      });

      return { message: 'Material completed', ...response };
    } catch (error: any) {
      console.error('Complete material error:', error);
      throw error;
    }
  }

  // Progress: Update lab status (with optional parameters for history)
  async updateLabStatus(labId: string, status: 'in-progress' | 'completed', parameters?: Record<string, any>): Promise<ApiResponse> {
    try {
      const body: any = { labId, status };
      if (parameters) {
        body.parameters = parameters;
      }

      const response = await apiRequest('/api/progress/lab', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      return { message: 'Lab status updated', ...response };
    } catch (error: any) {
      console.error('Update lab status error:', error);
      throw error;
    }
  }

  // Helper: Set token (for compatibility - not needed with Firebase Auth)
  setToken(token: string) {
    // Not needed - Firebase Auth handles tokens automatically
  }

  clearToken() {
    // Not needed - Firebase Auth handles this
  }
}

export const api = new HybridApiService();
export default api;
