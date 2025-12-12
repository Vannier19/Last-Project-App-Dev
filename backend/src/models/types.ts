// Tipe Data User
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'student'; // Penting untuk membedakan akses
  createdAt: Date;
}

// Tipe Data Materi (Untuk Sidebar & Konten)
export interface Material {
  id?: string;        // ID dari Firestore
  title: string;      // Judul Materi (Misal: "Pengenalan React")
  type: 'video' | 'article' | 'lab'; 
  content: string;    // Isi teks atau HTML
  videoUrl?: string;  // Link video jika ada
  order: number;      // Urutan muncul di sidebar (1, 2, 3...)
}

// Tipe Data Kuis
export interface Quiz {
  id?: string;
  materialId: string; // Relasi: Kuis ini milik materi mana?
  questions: Array<{
    question: string;
    options: string[]; // ["A", "B", "C", "D"]
    correctAnswer: number; // Index jawaban benar (0-3)
  }>;
}

// Tipe Data Lab
export interface Lab {
  id?: string;
  materialId: string;
  title: string;
  config: string; // JSON string untuk konfigurasi awal lab
}

export interface UserProgress {
  userId: string;
  completedMaterials: string[]; // Array ID materi yang sudah dibaca ["mat1", "mat2"]
  quizScores: Record<string, number>; // Object skor kuis: { "quiz1_id": 80, "quiz2_id": 100 }
  labStatus: Record<string, 'not-started' | 'in-progress' | 'completed'>; // Status Lab
  lastUpdated: Date;
}