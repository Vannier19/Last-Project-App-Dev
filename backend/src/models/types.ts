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

// Detail jawaban per soal quiz
export interface QuizAnswerDetail {
  questionNumber: number;      // Nomor soal (1, 2, 3, ...)
  question: string;            // Teks pertanyaan
  userAnswer: string;          // Jawaban yang dipilih user
  correctAnswer: string;       // Jawaban yang benar
  isCorrect: boolean;          // Apakah jawaban user benar?
}

// Data lengkap hasil quiz
export interface QuizResult {
  score: number;               // Nilai total (misal: 80)
  totalQuestions: number;      // Total soal
  correctAnswers: number;      // Jumlah jawaban benar
  answers: QuizAnswerDetail[]; // Detail per soal
  submittedAt: Date;           // Waktu submit
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
  quizResults: Record<string, QuizResult>; // Detail lengkap hasil quiz per quizId
  labStatus: Record<string, 'not-started' | 'in-progress' | 'completed'>; // Status Lab
  lastUpdated: Date;
}
