import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import * as dotenv from 'dotenv';
dotenv.config();

// --- INI BAGIAN YANG ANDA DAPATKAN DARI CONSOLE ---
const firebaseConfig = {
  apiKey: "AIzaSyB2sB14LP2FijDhVQLvqCeTvbsERo1FN38",
  authDomain: "virtual-lab-fisics-app-debb3.firebaseapp.com",
  projectId: "virtual-lab-fisics-app-debb3",
  storageBucket: "virtual-lab-fisics-app-debb3.firebasestorage.app",
  messagingSenderId: "796874701938",
  appId: "1:796874701938:web:64f3d0174a191bdafe56eb"
};

// Inisialisasi App & Auth
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function getToken() {
  try {
    // Gunakan email & password yang sudah Anda buat di Authentication Console
    console.log("⏳ Mencoba login sebagai siswa@fisika.com...");
    
    // Pastikan user ini (siswa@fisika.com) sudah dibuat di menu Authentication -> Users
    const userCredential = await signInWithEmailAndPassword(auth, "siswa@fisika.com", "password123");
    
    // Ambil Token JWT
    const token = await userCredential.user.getIdToken();
    
    console.log("\n✅ LOGIN BERHASIL! Ini Token Anda:\n");
    console.log(token); 
    console.log("\n(Copy token panjang di atas untuk dipakai tes di Postman/Terminal)\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Gagal login:", error);
    console.log("\nTips: Pastikan di Firebase Console -> Authentication -> Users sudah ada user: siswa@fisika.com");
    process.exit(1);
  }
}

getToken();