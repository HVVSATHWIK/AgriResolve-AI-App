import { Request, Response, NextFunction } from 'express';
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { logger } from '../utils/logger.js';

// Extend Express Session to include request tracking
declare module 'express-session' {
  interface SessionData {
    requestHistory: RequestRecord[];
  }
}

interface RequestRecord {
  timestamp: number;
  endpoint: string;
}

/**
 * Calculate remaining cooldown time in seconds
 */
const calculateCooldownTime = (requestHistory: RequestRecord[], windowMs: number): number => {
  if (!requestHistory || requestHistory.length === 0) {
    return 0;
  }

  const now = Date.now();
  const oldestRelevantRequest = requestHistory[0];
  const timeSinceOldest = now - oldestRelevantRequest.timestamp;
  const remainingCooldown = Math.ceil((windowMs - timeSinceOldest) / 1000);

  return Math.max(0, remainingCooldown);
};

/**
 * Get recent requests within the specified time window
 */
const getRecentRequests = (requestHistory: RequestRecord[], windowMs: number): RequestRecord[] => {
  if (!requestHistory) {
    return [];
  }

  const now = Date.now();
  return requestHistory.filter(record => now - record.timestamp < windowMs);
};

/**
 * Long-term rate limiter: 20 requests per hour per session
 * Requirement 7.5: Backend shall enforce maximum of 20 requests per hour per user
 */
export const hourlyRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 requests per hour
  standardHeaders: true,
  legacyHeaders: false,

  // Use session ID as the key for rate limiting
  keyGenerator: (req: Request): string => {
    // If session exists, use it. Otherwise fall back to IP.
    // Note: Render's load balancer handles IP extraction via 'trust proxy' setting in index.ts
    return req.session?.id || req.ip || 'unknown';
  },

  // Disable all express-rate-limit validations to prevent IPv6 crash on Render
  validate: false,

  // Custom handler for rate limit exceeded
  handler: (req: Request, res: Response) => {
    const requestHistory = req.session?.requestHistory || [];
    const cooldownSeconds = calculateCooldownTime(requestHistory, 60 * 60 * 1000);
    const resetTime = new Date(Date.now() + cooldownSeconds * 1000);

    logger.warn(`Hourly rate limit exceeded for session: ${req.session?.id}`);

    res.status(429).json({
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Maximum 20 requests per hour. Please try again later.',
      retryAfter: cooldownSeconds,
      resetTime: resetTime.toISOString(),
      quotaRemaining: 0,
      timestamp: new Date().toISOString()
    });
  },

  // Skip rate limiting for certain conditions
  skip: (req: Request) => {
    // Skip for health checks
    return req.path === '/health';
  }
});

/**
 * Short-term rate limiter: 5 requests per 10 minutes per session
 * Requirement 7.2: When user exceeds 5 requests within 10 minutes, rate limiter shall block additional requests
 */
export const shortTermRateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  // Skip for health checks
  if (req.path === '/health') {
    return next();
  }

  // Initialize session request history if not exists
  if (!req.session) {
    logger.error('Session not initialized for rate limiting');
    res.status(500).json({
      error: 'Server Configuration Error',
      message: 'Session management not available',
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (!req.session.requestHistory) {
    req.session.requestHistory = [];
  }

  const windowMs = 10 * 60 * 1000; // 10 minutes
  const maxRequests = 5;
  const now = Date.now();

  // Get recent requests within the 10-minute window
  const recentRequests = getRecentRequests(req.session.requestHistory, windowMs);

  // Check if limit is exceeded
  if (recentRequests.length >= maxRequests) {
    const cooldownSeconds = calculateCooldownTime(recentRequests, windowMs);
    const resetTime = new Date(now + cooldownSeconds * 1000);

    logger.warn(`Short-term rate limit exceeded for session: ${req.session.id}`);

    res.status(429).json({
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Maximum 5 requests per 10 minutes. Please wait.',
      retryAfter: cooldownSeconds,
      cooldownSeconds,
      resetTime: resetTime.toISOString(),
      quotaRemaining: 0,
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Track this request
  const requestRecord: RequestRecord = {
    timestamp: now,
    endpoint: req.path
  };

  // Add current request to history
  req.session.requestHistory.push(requestRecord);

  // Clean up old requests (keep only last hour for efficiency)
  req.session.requestHistory = req.session.requestHistory.filter(
    record => now - record.timestamp < 60 * 60 * 1000
  );

  // Calculate remaining quota
  const quotaRemaining = maxRequests - (recentRequests.length + 1);

  // Add quota information to response headers
  res.setHeader('X-RateLimit-Limit', maxRequests.toString());
  res.setHeader('X-RateLimit-Remaining', Math.max(0, quotaRemaining).toString());
  res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

  next();
};

/**
 * Middleware to add rate limit status to response
 * Requirement 7.6: System shall show remaining request quota to user
 */
export const rateLimitStatus = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.session?.requestHistory) {
    return next();
  }

  const shortTermWindow = 10 * 60 * 1000; // 10 minutes
  const hourlyWindow = 60 * 60 * 1000; // 1 hour

  const recentShortTerm = getRecentRequests(req.session.requestHistory, shortTermWindow);
  const recentHourly = getRecentRequests(req.session.requestHistory, hourlyWindow);

  const shortTermRemaining = Math.max(0, 5 - recentShortTerm.length);
  const hourlyRemaining = Math.max(0, 20 - recentHourly.length);

  // Attach rate limit info to request for use in handlers
  (req as any).rateLimitInfo = {
    shortTerm: {
      limit: 5,
      remaining: shortTermRemaining,
      used: recentShortTerm.length,
      resetTime: recentShortTerm.length > 0
        ? new Date(recentShortTerm[0].timestamp + shortTermWindow)
        : new Date(Date.now() + shortTermWindow)
    },
    hourly: {
      limit: 20,
      remaining: hourlyRemaining,
      used: recentHourly.length,
      resetTime: recentHourly.length > 0
        ? new Date(recentHourly[0].timestamp + hourlyWindow)
        : new Date(Date.now() + hourlyWindow)
    }
  };

  next();
};

/**
 * Helper function to get rate limit info from request
 */
export const getRateLimitInfo = (req: Request): any => {
  return (req as any).rateLimitInfo || {
    shortTerm: { limit: 5, remaining: 5, used: 0 },
    hourly: { limit: 20, remaining: 20, used: 0 }
  };
};
