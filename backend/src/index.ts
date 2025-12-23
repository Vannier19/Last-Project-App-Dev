import express from 'express';
import cors from 'cors';
import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';

// Import Routes
import materialRoutes from './routes/materialRoutes';
import authRoutes from './routes/authRoutes';
import progressRoutes from './routes/progressRoutes';

// Setup Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp();
}



// Set global options
setGlobalOptions({ maxInstances: 10 });

const app = express();

// More explicit CORS configuration: allow Authorization header and common methods.
const corsOptions = {
    origin: true, // set to specific origins in production e.g. ['https://yourdomain.com']
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/materials', materialRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/progress', progressRoutes);

app.get('/', (req, res) => {
    res.json({ message: "Server Ready on Firebase 🚀" });
});

// Export aplikasi express sebagai Cloud Function bernama "api"
export const api = onRequest(app);
