// API Service untuk koneksi ke Backend
import { Platform } from 'react-native';

// Detect correct API URL based on platform
const getApiUrl = () => {
  // Gunakan environment variable jika ada
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Fallback untuk development
  if (__DEV__) {
    return Platform.select({
      android: 'http://10.0.2.2:3001/api',  // Android Emulator
      ios: 'http://localhost:3001/api',      // iOS Simulator
      default: 'http://localhost:3001/api'   // Web/other
    });
  }

  // Production URL
  return 'https://your-production-api.com/api';
};

const API_URL = getApiUrl();

interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async syncUser(token: string) {
    this.setToken(token);
    return this.request('/auth/sync', {
      method: 'POST',
    });
  }

  // Materials endpoints
  async getMaterials() {
    return this.request('/materials');
  }

  async getMaterialById(id: string) {
    return this.request(`/materials/${id}`);
  }

  // Progress endpoints
  async saveQuizProgress(data: {
    materialId: string;
    score: number;
    answers: any[];
  }) {
    return this.request('/progress/quiz', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProgress() {
    return this.request('/progress');
  }
}

export const api = new ApiService(API_URL);
export default api;
