/**
 * NaviDocs Backend API
 * Express server with SQLite + Meilisearch
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors({
  origin: NODE_ENV === 'production' ? process.env.ALLOWED_ORIGINS?.split(',') : '*',
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later'
});

app.use('/api/', limiter);

// Health check
app.get('/health', async (req, res) => {
  try {
    // TODO: Check database, Meilisearch, queue
    res.json({
      status: 'ok',
      timestamp: Date.now(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Import route modules
import uploadRoutes from './routes/upload.js';
import jobsRoutes from './routes/jobs.js';
import searchRoutes from './routes/search.js';
import documentsRoutes from './routes/documents.js';
import imagesRoutes from './routes/images.js';

// API routes
app.use('/api/upload', uploadRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api', imagesRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`NaviDocs API listening on port ${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;
