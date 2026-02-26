import { Request, Response, NextFunction, Router } from 'express';
import { serviceRegistry } from '../services/serviceRegistry.js';
import { logger } from '../utils/logger.js';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { ClientRequest, IncomingMessage, ServerResponse } from 'http';
import {
  validateAnalysisRequest,
  validateWeatherData,
  sanitizeRequestBody
} from '../middleware/inputValidator.js';
import { getRateLimitInfo } from '../middleware/rateLimiter.js';

// Extend Express Request interface to include user property
// Extend Express Request interface to include user property
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      email: string;
      role: string;
      permissions: string[];
    };
  }
}



const router = Router();

// Service routing configuration
const serviceRoutes = {
  '/collaboration': 'collaboration-service',
  '/expert': 'expert-service',
  '/community': 'community-service',
  '/iot': 'iot-service',
  '/treatment': 'treatment-service',
  '/sync': 'sync-service'
} as const;

// Dynamic service proxy setup
Object.entries(serviceRoutes).forEach(([path, serviceName]) => {
  router.use(path, (req: Request, res: Response, next: NextFunction) => {
    const service = serviceRegistry.getService(serviceName as string);

    if (!service || !service.healthy) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: `${serviceName} is currently unavailable`,
        timestamp: new Date().toISOString()
      });
    }

    // Create proxy middleware for the service
    const proxyOptions: Options = {
      target: `http://localhost:${service.port}`,
      changeOrigin: true,
      pathRewrite: {
        [`^${path}`]: ''
      },
      on: {
        error: (err: Error, req: IncomingMessage, res: ServerResponse<IncomingMessage> | any) => {
          logger.error(`Proxy error for ${serviceName}:`, err);
          // Type casting to handle express response methods if needed, or use bare node response
          const expressRes = res as unknown as Response;
          if (!expressRes.headersSent) {
            expressRes.status(502).json({
              error: 'Bad Gateway',
              message: `Error connecting to ${serviceName}`,
              timestamp: new Date().toISOString()
            });
          }
        },
        proxyReq: (proxyReq: ClientRequest, req: IncomingMessage, res: ServerResponse<IncomingMessage>) => {
          // Add service metadata headers
          proxyReq.setHeader('X-Gateway-Service', serviceName);
          proxyReq.setHeader('X-Gateway-Timestamp', new Date().toISOString());

          // Type cast to access express request properties
          const expressReq = req as unknown as Request;

          // Forward user context if available
          if (expressReq.user) {
            proxyReq.setHeader('X-User-ID', expressReq.user.id);
            proxyReq.setHeader('X-User-Role', expressReq.user.role);
          }
        }
      }
    };

    const proxy = createProxyMiddleware(proxyOptions);

    proxy(req, res, next);
  });
});

// Service discovery endpoint
router.get('/services', (req: Request, res: Response) => {
  const services = serviceRegistry.getAllServices();
  res.json({
    services: (Object.entries(services) as Array<[string, { healthy: boolean; port: number; lastHealthCheck: Date }]>).map(([name, service]) => ({
      name,
      status: service.healthy ? 'healthy' : 'unhealthy',
      port: service.port,
      lastHealthCheck: service.lastHealthCheck
    })),
    timestamp: new Date().toISOString()
  });
});

/**
 * Analysis endpoint with input validation
 * Requirements 8.4, 8.5, 8.6: Validate and sanitize all inputs
 */
router.post('/analysis',
  sanitizeRequestBody,
  validateAnalysisRequest,
  validateWeatherData,
  async (req: Request, res: Response) => {
    try {
      const { cropType, image, weatherData, notes, location } = req.body;
      const rateLimitInfo = getRateLimitInfo(req);

      logger.info('Analysis request received', {
        cropType,
        sessionId: req.session?.id,
        hasWeatherData: !!weatherData,
        quotaRemaining: rateLimitInfo.hourly.remaining
      });

      // Here you would integrate with the actual analysis service
      // For now, return a success response with validation confirmation
      res.json({
        success: true,
        message: 'Analysis request validated successfully',
        data: {
          cropType,
          hasImage: !!image,
          hasWeatherData: !!weatherData,
          hasNotes: !!notes,
          hasLocation: !!location
        },
        rateLimitInfo: {
          quotaRemaining: rateLimitInfo.hourly.remaining,
          quotaUsed: rateLimitInfo.hourly.used,
          resetTime: rateLimitInfo.hourly.resetTime
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Analysis request error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to process analysis request',
        timestamp: new Date().toISOString()
      });
    }
  }
);

// Load balancing for high-availability services
router.use('/load-balance/:serviceName', (req: Request, res: Response, next: NextFunction) => {
  const { serviceName } = req.params;
  const name = serviceName as string;
  const instances = serviceRegistry.getServiceInstances(name);

  if (instances.length === 0) {
    return res.status(503).json({
      error: 'No Available Instances',
      message: `No healthy instances of ${name} available`,
      timestamp: new Date().toISOString()
    });
  }

  // Simple round-robin load balancing
  const instance = serviceRegistry.getNextInstance(name);

  const proxyOptions: Options = {
    target: `http://localhost:${instance.port}`,
    changeOrigin: true,
    pathRewrite: {
      [`^/load-balance/${name}`]: ''
    }
  };

  const proxy = createProxyMiddleware(proxyOptions);

  proxy(req, res, next);
});

export { router as apiGateway };