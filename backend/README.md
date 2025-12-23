# Backend Firebase Functions - Setup Guide

Backend Express.js dengan TypeScript yang di-deploy ke Firebase Functions menggunakan **root folder structure**.

## 📁 Struktur Folder

```
backend/
├── src/                        # Source code
│   ├── index.ts               # Entry point (exports Cloud Function)
│   ├── controllers/           # Business logic
│   ├── middleware/            # Auth & validation
│   ├── models/                # TypeScript types
│   └── routes/                # Route definitions
├── dist/                      # Compiled JavaScript (auto-generated)
├── firebase.json              # Firebase config
├── package.json               # Dependencies & scripts
├── tsconfig.json              # TypeScript config
├── serviceAccountKey.json     # Firebase Admin key (jangan commit!)
└── .env.backup               # Backup env vars (reference only)
```

## 🚀 Setup & Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Setup

Pastikan Firebase CLI sudah terinstall:

```bash
npm install -g firebase-tools
firebase login
```

### 3. Build Project

```bash
npm run build
```

## 🛠️ Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm run build` | `tsc` | Compile TypeScript ke JavaScript |
| `npm run serve` | `npm run build && firebase emulators:start --only functions` | Run local emulator |
| `npm start` | `npm run serve` | Alias untuk serve |
| `npm run deploy` | `firebase deploy --only functions` | Deploy ke Firebase |
| `npm run logs` | `firebase functions:log` | View production logs |

## 🧪 Local Development

### Start Emulator

```bash
npm start
```

Emulator akan berjalan di:
- **Functions**: http://127.0.0.1:5001/[PROJECT-ID]/[REGION]/api
- **Emulator UI**: http://127.0.0.1:4000

### Test API

```bash
# Test root endpoint
curl http://127.0.0.1:5001/virtual-lab-fisics-app-debb3/us-central1/api/

# Test materials endpoint
curl http://127.0.0.1:5001/virtual-lab-fisics-app-debb3/us-central1/api/api/materials
```

## 🔐 Environment Variables

Firebase Functions **tidak membaca `.env` secara otomatis**. 

### Untuk Production

Gunakan Firebase Functions Config:

```bash
# Set config
firebase functions:config:set jwt.secret="your-secret-key"

# View config
firebase functions:config:get

# Deploy dengan config
firebase deploy --only functions
```

### Untuk Sensitive Data

Gunakan Google Cloud Secret Manager (best practice). Lihat [`ENV_SETUP.md`](ENV_SETUP.md) untuk detail lengkap.

## 📦 Deployment

### Pre-deployment Checklist

- [ ] Test dengan emulator (`npm start`)
- [ ] Pastikan build berhasil (`npm run build`)
- [ ] Set environment variables via Firebase config
- [ ] Remove hardcoded secrets
- [ ] Update Firebase Admin initialization (jangan pakai serviceAccountKey)

### Deploy

```bash
# Deploy functions
npm run deploy

# Atau spesifik function
firebase deploy --only functions:api
```

### View Logs

```bash
# Real-time logs
npm run logs

# Atau via Firebase console
firebase functions:log --limit 50
```

## 🔧 Configuration Files

### firebase.json

```json
{
  "functions": [
    {
      "source": ".",              // Root folder sebagai source
      "codebase": "default",
      "ignore": ["node_modules", "functions"],
      "predeploy": ["npm run build"]
    }
  ]
}
```

### package.json

- **main**: `dist/index.js` - Entry point hasil build
- **engines.node**: `22` - Node version untuk Firebase

### tsconfig.json

- **outDir**: `dist` - Output folder untuk compiled JavaScript
- **include**: `["src"]` - Source folder

## 🏗️ Architecture

### Entry Point (src/index.ts)

```typescript
import express from 'express';
import { onRequest } from 'firebase-functions/v2/https';

const app = express();

// Setup routes
app.use('/api/auth', authRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/progress', progressRoutes);

// Export as Cloud Function
export const api = onRequest(app);
```

**Penting**: 
- ✅ Gunakan `export const api = onRequest(app)`
- ❌ Jangan gunakan `app.listen()` (ini untuk local server, bukan Cloud Functions)

### Firebase Admin SDK

```typescript
// Di Firebase Functions, cukup ini:
if (!admin.apps.length) {
    admin.initializeApp();
}

// TIDAK perlu credential manual
```

## 🐛 Troubleshooting

### Error: "Failed to load function definition"

**Penyebab**: Ada error kompilasi atau import tidak benar

**Solusi**:
```bash
# Clear dist folder
rm -rf dist
npm run build
```

### Error: "Failed to load environment variables from .env"

**Penyebab**: Firebase Functions tidak support `.env` file

**Solusi**: 
1. Rename atau hapus file `.env`
2. Gunakan Firebase config atau Secret Manager

### Error: "The default Firebase app does not exist"

**Penyebab**: `admin.firestore()` dipanggil sebelum `admin.initializeApp()`

**Solusi**: Pindahkan `admin.firestore()` ke dalam function body, bukan di global scope

### Warning: "node version mismatch"

**Penyebab**: Node version di `package.json` berbeda dengan system

**Solusi**: Update `engines.node` di `package.json` sesuai Node version Anda

## 📚 API Endpoints

### Public Endpoints

- `GET /` - Health check
- `GET /api/materials` - Get all materials

### Protected Endpoints (Require Auth Token)

- `POST /api/auth/sync` - Sync user data
- `GET /api/progress` - Get user progress
- `POST /api/progress/material` - Mark material complete
- `POST /api/progress/quiz` - Submit quiz score
- `POST /api/progress/lab` - Update lab status
- `POST /api/materials` - Create material (Admin only)

## 🔒 Authentication

Backend menggunakan Firebase Auth. Frontend harus mengirim token di header:

```
Authorization: Bearer <firebase-id-token>
```

Middleware `verifyToken` akan memvalidasi token dan inject user data ke `req.user`.

## 📝 Notes

- Struktur ini menggunakan **root folder** sebagai source (bukan folder `functions/`)
- File `.env.backup` hanya untuk referensi, tidak digunakan
- `serviceAccountKey.json` jangan di-commit ke Git
- Untuk production, gunakan Firebase Functions Config atau Secret Manager

## 🔗 Resources

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
