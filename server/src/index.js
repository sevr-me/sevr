import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import servicesRoutes from './routes/services.js';
import userRoutes from './routes/user.js';
import guidesRoutes from './routes/guides.js';
import queriesRoutes from './routes/queries.js';
import encryptedRoutes from './routes/encrypted.js';
import adminRoutes from './routes/admin.js';
import trackingRoutes from './routes/tracking.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://accounts.google.com", "https://apis.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://accounts.google.com", "https://www.googleapis.com", "https://oauth2.googleapis.com"],
      frameSrc: ["'self'", "https://accounts.google.com"],
      fontSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [];

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? (origin, callback) => {
        // Allow requests with no origin (same-origin, server-to-server)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    : true,
  credentials: true,
}));

// Global rate limit
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use(express.json({ limit: '10kb' }));

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../../dist');
  app.use(express.static(distPath));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/user', userRoutes);
app.use('/api/guides', guidesRoutes);
app.use('/api/queries', queriesRoutes);
app.use('/api/encrypted', encryptedRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/track', trackingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve privacy page at /privacy (without .html)
if (process.env.NODE_ENV === 'production') {
  app.get('/privacy', (req, res) => {
    const distPath = path.join(__dirname, '../../dist');
    res.sendFile(path.join(distPath, 'privacy.html'));
  });
}

// Serve frontend for all other routes in production (SPA)
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../../dist');
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
