import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { apiGateway } from './gateway/apiGateway.js';
import { analysisRouter } from './routes/analysis.js';
import timezoneRouter from './routes/timezone.js';
import { healthRouter } from './routes/health.js';
import { marketRouter } from './routes/market.js';
import { websocketManager } from './websocket/websocketManager.js';
import { serviceRegistry } from './services/serviceRegistry.js';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { hourlyRateLimiter, shortTermRateLimiter, rateLimitStatus } from './middleware/rateLimiter.js';
import { logger } from './utils/logger.js';

// Load environment variables, overriding any existing system/terminal vars
dotenv.config({ override: true });

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL,
      process.env.FRONTEND_URL,
      'https://agri-resolve-ai-app.vercel.app',
      'https://agri-resolve-ai.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
    ].filter(Boolean) as string[],
    methods: ["GET", "POST"]
  }
});

// Security: Bind to 0.0.0.0 in production for Render/Docker, localhost in dev
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';

const PORT = parseInt(process.env.PORT || '3001', 10);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

// CORS configuration for frontend communication
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  'https://agri-resolve-ai-app.vercel.app',  // primary deployed frontend
  'https://agri-resolve-ai.vercel.app',      // legacy / alternate URL
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean) as string[];

// @ts-ignore - Type mismatch between cors and Express 5
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Session management
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoints
// Requirements 16.1, 16.2: Service availability checking
app.use('/api/health', healthRouter);

// Authentication middleware for protected routes
app.use('/api', authMiddleware);

// Rate limiting middleware for API routes (session-based)
// Requirement 7.1, 7.2, 7.5: Enforce rate limits per session
app.use('/api', rateLimitStatus);
app.use('/api', shortTermRateLimiter);
app.use('/api', hourlyRateLimiter);

// Analysis endpoint with Gemini API proxy
// Requirements 5.1, 5.2, 5.3, 5.4, 5.5: Secure API proxying
// Requirements 5.1, 5.2, 5.3, 5.4, 5.5: Secure API proxying
app.use('/api', analysisRouter);

// Market Pulse endpoint
app.use('/api', marketRouter);

// Timezone management endpoints
// Requirements 12.1, 12.3: User timezone detection and storage
app.use('/api/timezone', timezoneRouter);

// API Gateway routing
app.use('/api', apiGateway);

// WebSocket connection handling
websocketManager.initialize(io);

// Error handling middleware
app.use(errorHandler);

// Start server only if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(PORT, HOST, () => {
    logger.info(`🚀 AgriResolve Collaborative Server running on ${HOST}:${PORT}`);
    logger.info(`📡 WebSocket server initialized`);
    logger.info(`🔒 Security middleware active`);
    logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🔐 Session management enabled`);

    // Initialize services
    serviceRegistry.startServices();
  });
}

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  // The server is built to dist/server/index.js, so the frontend is at ../../dist
  // actually, based on tsconfig.server.json outDir is ../dist/server
  // and vite builds to dist/
  // so from dist/server/index.js, we need to go up one level to dist/

  // Wait, let's double check the build output structure.
  // Vite builds to 'dist' (index.html, assets, etc)
  // Server builds to 'dist/server' (index.js, etc)

  const clientBuildPath = path.join(__dirname, '..'); // This points to dist/

  app.use(express.static(clientBuildPath));

  // Handle React routing, return all requests to React app
  // Handle React routing, return all requests to React app
  // Fix for PathError: Missing parameter name at index 1: *
  app.get(/(.*)/, (req, res) => {
    // skip api routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    // Check if file exists, otherwise serve index.html
    const filePath = path.join(clientBuildPath, req.path);
    if (require('fs').existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    }
  });
}

// Trust proxy for rate limiting behind Render's load balancer
app.set('trust proxy', 1);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    serviceRegistry.stopServices();
    process.exit(0);
  });
});

export { app, server, io };