# Environment Variables untuk Firebase Functions

## Local Development (Emulator)

Firebase Functions **tidak membaca file `.env` secara otomatis**. Untuk local development dengan emulator, gunakan salah satu cara berikut:

### Option 1: Menggunakan dotenv (Tidak Direkomendasikan)
Karena sudah tidak digunakan dalam kode. Firebase Functions tidak memerlukan dotenv.

### Option 2: Firebase Environment Config (Direkomendasikan untuk Production)

Untuk production deployment, gunakan Firebase Environment Configuration:

```bash
# Set environment variable
firebase functions:config:set jwt.secret="your-jwt-secret" service.account="path-to-key"

# Get current config
firebase functions:config:get

# Deploy dengan config baru
firebase deploy --only functions
```

Kemudian akses di kode:
```typescript
import * as functions from 'firebase-functions';

const jwtSecret = functions.config().jwt.secret;
```

### Option 3: Google Cloud Secret Manager (Best Practice)

Untuk sensitive data seperti API keys, database passwords, gunakan Secret Manager:

1. **Buat secret di Google Cloud Console**
2. **Update firebase.json**:
```json
{
  "functions": [
    {
      "source": ".",
      "codebase": "default",
      "secretEnvironment": ["JWT_SECRET", "DATABASE_URL"]
    }
  ]
}
```

3. **Akses di kode**:
```typescript
import { defineSecret } from 'firebase-functions/params';

const jwtSecret = defineSecret('JWT_SECRET');

export const api = onRequest(
  { secrets: [jwtSecret] },
  (req, res) => {
    const secret = jwtSecret.value();
    // Use secret
  }
);
```

## Firebase Admin SDK

Untuk Firebase Admin SDK di Functions, **tidak perlu serviceAccountKey.json**. Firebase automatically uses Application Default Credentials:

```typescript
// Di Firebase Functions, cukup ini:
admin.initializeApp();

// TIDAK perlu:
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccountKey)
// });
```

## Testing Local dengan Emulator

Karena tidak ada `.env`, variabel environment harus di-set manual atau gunakan Firebase Functions config untuk testing:

```bash
# Set config untuk testing
firebase functions:config:set test.jwt_secret="test-secret"

# Run emulator
npm run serve
```

## Production Deployment

Sebelum deploy, pastikan:
1. ✅ Semua secrets sudah di-set via `firebase functions:config:set` atau Secret Manager
2. ✅ Firebase Admin tidak menggunakan serviceAccountKey.json
3. ✅ Tidak ada hardcoded credentials

```bash
# Deploy
npm run deploy
```

## File .env.backup

File `.env.backup` adalah backup dari konfigurasi local development sebelumnya. File ini **tidak akan digunakan** oleh Firebase Functions dan hanya untuk referensi:

```env
# Backend Environment Variables
PORT=3001  # Tidak diperlukan di Firebase Functions

# Firebase Admin SDK
SERVICE_ACCOUNT_PATH=./serviceAccountKey.json  # Tidak diperlukan di Firebase Functions

# JWT Secret (untuk token authentication)
JWT_SECRET=kF8$2mQ!zP0L9a@Xw#R7sE4vN1B  # Pindahkan ke Firebase config atau Secret Manager
```

## Checklist Deployment

- [ ] Remove atau backup file `.env`
- [ ] Set semua environment variables via Firebase config atau Secret Manager
- [ ] Pastikan `admin.initializeApp()` tidak menggunakan serviceAccountKey
- [ ] Test dengan emulator: `npm run serve`
- [ ] Deploy: `npm run deploy`
