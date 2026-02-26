import { Request, Response, NextFunction } from 'express';
import { shortTermRateLimiter, rateLimitStatus, getRateLimitInfo } from '../rateLimiter.js';
import * as fc from 'fast-check';

// Mock logger
jest.mock('../../utils/logger.js', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Rate Limiter Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let setHeaderMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    setHeaderMock = jest.fn();

    mockRequest = {
      path: '/api/analysis',
      session: {
        id: 'test-session-123',
        requestHistory: [],
        cookie: {} as any,
        regenerate: jest.fn(),
        destroy: jest.fn(),
        reload: jest.fn(),
        save: jest.fn(),
        touch: jest.fn(),
        resetMaxAge: jest.fn()
      } as any
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
      setHeader: setHeaderMock
    };

    nextFunction = jest.fn();
  });

  describe('shortTermRateLimiter', () => {
    it('should allow requests under the limit', () => {
      shortTermRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
      expect(mockRequest.session?.requestHistory).toHaveLength(1);
    });

    it('should track request history correctly', () => {
      const now = Date.now();

      // Make 3 requests
      for (let i = 0; i < 3; i++) {
        shortTermRateLimiter(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );
      }

      expect(mockRequest.session?.requestHistory).toHaveLength(3);
      expect(nextFunction).toHaveBeenCalledTimes(3);

      // Verify timestamps are recent
      mockRequest.session?.requestHistory?.forEach(record => {
        expect(record.timestamp).toBeGreaterThanOrEqual(now);
        expect(record.endpoint).toBe('/api/analysis');
      });
    });

    it('should block requests when 5 requests in 10 minutes limit is exceeded', () => {
      const now = Date.now();

      // Add 5 requests to history (within 10 minutes)
      mockRequest.session!.requestHistory = [
        { timestamp: now - 1000, endpoint: '/api/analysis' },
        { timestamp: now - 2000, endpoint: '/api/analysis' },
        { timestamp: now - 3000, endpoint: '/api/analysis' },
        { timestamp: now - 4000, endpoint: '/api/analysis' },
        { timestamp: now - 5000, endpoint: '/api/analysis' }
      ];

      shortTermRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(429);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Maximum 5 requests per 10 minutes. Please wait.',
          quotaRemaining: 0
        })
      );
    });

    it('should return appropriate cooldown time when rate limited', () => {
      const now = Date.now();
      const tenMinutesMs = 10 * 60 * 1000;

      // Add 5 requests, oldest one 5 minutes ago
      mockRequest.session!.requestHistory = [
        { timestamp: now - 5 * 60 * 1000, endpoint: '/api/analysis' },
        { timestamp: now - 4 * 60 * 1000, endpoint: '/api/analysis' },
        { timestamp: now - 3 * 60 * 1000, endpoint: '/api/analysis' },
        { timestamp: now - 2 * 60 * 1000, endpoint: '/api/analysis' },
        { timestamp: now - 1 * 60 * 1000, endpoint: '/api/analysis' }
      ];

      shortTermRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(429);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          cooldownSeconds: expect.any(Number),
          retryAfter: expect.any(Number)
        })
      );

      const response = jsonMock.mock.calls[0][0];
      // Cooldown should be approximately 5 minutes (300 seconds)
      expect(response.cooldownSeconds).toBeGreaterThan(290);
      expect(response.cooldownSeconds).toBeLessThan(310);
    });

    it('should allow requests after old requests expire from 10-minute window', () => {
      const now = Date.now();
      const elevenMinutesAgo = now - 11 * 60 * 1000;

      // Add 5 requests that are older than 10 minutes
      mockRequest.session!.requestHistory = [
        { timestamp: elevenMinutesAgo, endpoint: '/api/analysis' },
        { timestamp: elevenMinutesAgo + 1000, endpoint: '/api/analysis' },
        { timestamp: elevenMinutesAgo + 2000, endpoint: '/api/analysis' },
        { timestamp: elevenMinutesAgo + 3000, endpoint: '/api/analysis' },
        { timestamp: elevenMinutesAgo + 4000, endpoint: '/api/analysis' }
      ];

      shortTermRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Should allow the request since old requests are outside the window
      expect(nextFunction).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should set rate limit headers on successful requests', () => {
      shortTermRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(setHeaderMock).toHaveBeenCalledWith('X-RateLimit-Limit', '5');
      expect(setHeaderMock).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(String));
      expect(setHeaderMock).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String));
    });

    it('should skip rate limiting for health check endpoint', () => {
      (mockRequest as any).path = '/health';

      shortTermRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.session?.requestHistory).toHaveLength(0);
    });

    it('should handle missing session gracefully', () => {
      mockRequest.session = undefined;

      shortTermRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Server Configuration Error',
          message: 'Session management not available'
        })
      );
    });

    it('should clean up old requests from history', () => {
      const now = Date.now();
      const twoHoursAgo = now - 2 * 60 * 60 * 1000;

      // Add some very old requests
      mockRequest.session!.requestHistory = [
        { timestamp: twoHoursAgo, endpoint: '/api/analysis' },
        { timestamp: now - 5000, endpoint: '/api/analysis' }
      ];

      shortTermRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Old requests should be cleaned up (only keep last hour)
      const history = mockRequest.session!.requestHistory;
      expect(history.every(record => now - record.timestamp < 60 * 60 * 1000)).toBe(true);
    });
  });

  describe('rateLimitStatus', () => {
    it('should attach rate limit info to request', () => {
      const now = Date.now();

      mockRequest.session!.requestHistory = [
        { timestamp: now - 1000, endpoint: '/api/analysis' },
        { timestamp: now - 2000, endpoint: '/api/analysis' }
      ];

      rateLimitStatus(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      const rateLimitInfo = getRateLimitInfo(mockRequest as Request);

      expect(rateLimitInfo).toBeDefined();
      expect(rateLimitInfo.shortTerm).toEqual(
        expect.objectContaining({
          limit: 5,
          remaining: 3,
          used: 2
        })
      );
      expect(rateLimitInfo.hourly).toEqual(
        expect.objectContaining({
          limit: 20,
          remaining: 18,
          used: 2
        })
      );
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should handle empty request history', () => {
      rateLimitStatus(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      const rateLimitInfo = getRateLimitInfo(mockRequest as Request);

      expect(rateLimitInfo.shortTerm.remaining).toBe(5);
      expect(rateLimitInfo.hourly.remaining).toBe(20);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should handle missing session', () => {
      mockRequest.session = undefined;

      rateLimitStatus(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should calculate correct remaining quota at 80% usage (warning threshold)', () => {
      const now = Date.now();

      // Add 16 requests (80% of 20 hourly limit)
      mockRequest.session!.requestHistory = Array.from({ length: 16 }, (_, i) => ({
        timestamp: now - i * 1000,
        endpoint: '/api/analysis'
      }));

      rateLimitStatus(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      const rateLimitInfo = getRateLimitInfo(mockRequest as Request);

      expect(rateLimitInfo.hourly.remaining).toBe(4);
      expect(rateLimitInfo.hourly.used).toBe(16);
      // At 80% usage, should trigger warning in UI
      expect(rateLimitInfo.hourly.used / rateLimitInfo.hourly.limit).toBeGreaterThanOrEqual(0.8);
    });
  });

  describe('getRateLimitInfo', () => {
    it('should return default values when no rate limit info attached', () => {
      const info = getRateLimitInfo(mockRequest as Request);

      expect(info).toEqual({
        shortTerm: { limit: 5, remaining: 5, used: 0 },
        hourly: { limit: 20, remaining: 20, used: 0 }
      });
    });

    it('should return attached rate limit info when available', () => {
      const customInfo = {
        shortTerm: { limit: 5, remaining: 2, used: 3 },
        hourly: { limit: 20, remaining: 10, used: 10 }
      };

      (mockRequest as any).rateLimitInfo = customInfo;

      const info = getRateLimitInfo(mockRequest as Request);

      expect(info).toEqual(customInfo);
    });
  });

  describe('Edge Cases', () => {
    it('should handle exactly 5 requests in 10 minutes', () => {
      const now = Date.now();

      // Add exactly 4 requests
      mockRequest.session!.requestHistory = [
        { timestamp: now - 1000, endpoint: '/api/analysis' },
        { timestamp: now - 2000, endpoint: '/api/analysis' },
        { timestamp: now - 3000, endpoint: '/api/analysis' },
        { timestamp: now - 4000, endpoint: '/api/analysis' }
      ];

      // This should be the 5th request - should succeed
      shortTermRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();

      // Reset mocks
      nextFunction = jest.fn();

      // Now try a 6th request - should fail
      shortTermRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(429);
    });

    it('should handle requests at exactly 10 minute boundary', () => {
      const now = Date.now();
      const tenMinutesMs = 10 * 60 * 1000;

      // Add 5 requests at exactly 10 minutes ago
      mockRequest.session!.requestHistory = [
        { timestamp: now - tenMinutesMs, endpoint: '/api/analysis' },
        { timestamp: now - tenMinutesMs + 1000, endpoint: '/api/analysis' },
        { timestamp: now - tenMinutesMs + 2000, endpoint: '/api/analysis' },
        { timestamp: now - tenMinutesMs + 3000, endpoint: '/api/analysis' },
        { timestamp: now - tenMinutesMs + 4000, endpoint: '/api/analysis' }
      ];

      shortTermRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Requests at exactly 10 minutes should be filtered out
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should handle concurrent requests from same session', () => {
      const now = Date.now();

      // Simulate 3 concurrent requests (same timestamp)
      mockRequest.session!.requestHistory = [
        { timestamp: now, endpoint: '/api/analysis' },
        { timestamp: now, endpoint: '/api/analysis' },
        { timestamp: now, endpoint: '/api/analysis' }
      ];

      shortTermRateLimiter(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.session?.requestHistory).toHaveLength(4);
    });
  });

  /**
   * Property-Based Tests
   * Feature: agricultural-accuracy-and-security-fixes
   */
  describe('Property-Based Tests', () => {
    /**
     * Property 15: Request tracking
     * **Validates: Requirements 7.1**
     * 
     * For any analysis request made by a user, the rate limiter should 
     * increment the request count for that user's session.
     * 
     * This property verifies that:
     * 1. Each request increments the session's request history
     * 2. The request count increases monotonically (never decreases)
     * 3. Each tracked request has a valid timestamp and endpoint
     */
    describe('Property 15: Request tracking', () => {
      it('should increment request count for any valid analysis request', () => {
        // Feature: agricultural-accuracy-and-security-fixes, Property 15: Request tracking
        
        fc.assert(
          fc.property(
            // Generate a sequence of 1-10 requests
            fc.integer({ min: 1, max: 10 }),
            // Generate random endpoint paths
            fc.constantFrom(
              '/api/analysis',
              '/api/analyze',
              '/api/crop-analysis',
              '/api/disease-detection'
            ),
            (numRequests, endpoint) => {
              // Setup fresh request/response for each property test
              const jsonMock = jest.fn();
              const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
              const setHeaderMock = jest.fn();
              const nextFunction = jest.fn();

              const testRequest: Partial<Request> = {
                path: endpoint,
                session: {
                  id: `test-session-${Date.now()}`,
                  requestHistory: [],
                  cookie: {} as any,
                  regenerate: jest.fn(),
                  destroy: jest.fn(),
                  reload: jest.fn(),
                  save: jest.fn(),
                  touch: jest.fn(),
                  resetMaxAge: jest.fn()
                } as any
              };

              const testResponse: Partial<Response> = {
                status: statusMock,
                json: jsonMock,
                setHeader: setHeaderMock
              };

              const startTime = Date.now();
              let previousCount = 0;

              // Make the specified number of requests
              for (let i = 0; i < numRequests && i < 5; i++) {
                const currentCount = testRequest.session!.requestHistory!.length;
                
                // Property: Request count should never decrease
                expect(currentCount).toBeGreaterThanOrEqual(previousCount);

                shortTermRateLimiter(
                  testRequest as Request,
                  testResponse as Response,
                  nextFunction
                );

                const newCount = testRequest.session!.requestHistory!.length;

                // Property: Each request should increment the count by exactly 1
                expect(newCount).toBe(currentCount + 1);

                // Property: The new request should have a valid timestamp
                const latestRequest = testRequest.session!.requestHistory![newCount - 1];
                expect(latestRequest.timestamp).toBeGreaterThanOrEqual(startTime);
                expect(latestRequest.timestamp).toBeLessThanOrEqual(Date.now());

                // Property: The new request should have the correct endpoint
                expect(latestRequest.endpoint).toBe(endpoint);

                previousCount = newCount;
              }

              // Property: Final count should equal number of requests made (up to limit of 5)
              const expectedCount = Math.min(numRequests, 5);
              expect(testRequest.session!.requestHistory!.length).toBe(expectedCount);

              // Property: All requests in history should have valid structure
              testRequest.session!.requestHistory!.forEach(record => {
                expect(record).toHaveProperty('timestamp');
                expect(record).toHaveProperty('endpoint');
                expect(typeof record.timestamp).toBe('number');
                expect(typeof record.endpoint).toBe('string');
                expect(record.timestamp).toBeGreaterThan(0);
              });
            }
          ),
          { numRuns: 100 } // Minimum 100 iterations as per requirements
        );
      });

      it('should track requests independently for different sessions', () => {
        // Feature: agricultural-accuracy-and-security-fixes, Property 15: Request tracking
        
        fc.assert(
          fc.property(
            // Generate 2-5 different session IDs
            fc.array(fc.uuid(), { minLength: 2, maxLength: 5 }),
            // Generate 1-3 requests per session
            fc.integer({ min: 1, max: 3 }),
            (sessionIds, requestsPerSession) => {
              const sessions = new Map<string, any>();

              // Create separate session for each ID
              sessionIds.forEach(sessionId => {
                sessions.set(sessionId, {
                  id: sessionId,
                  requestHistory: [],
                  cookie: {} as any,
                  regenerate: jest.fn(),
                  destroy: jest.fn(),
                  reload: jest.fn(),
                  save: jest.fn(),
                  touch: jest.fn(),
                  resetMaxAge: jest.fn()
                });
              });

              // Make requests for each session
              sessionIds.forEach(sessionId => {
                const session = sessions.get(sessionId);
                
                for (let i = 0; i < requestsPerSession; i++) {
                  const jsonMock = jest.fn();
                  const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
                  const setHeaderMock = jest.fn();
                  const nextFunction = jest.fn();

                  const testRequest: Partial<Request> = {
                    path: '/api/analysis',
                    session: session as any
                  };

                  const testResponse: Partial<Response> = {
                    status: statusMock,
                    json: jsonMock,
                    setHeader: setHeaderMock
                  };

                  shortTermRateLimiter(
                    testRequest as Request,
                    testResponse as Response,
                    nextFunction
                  );
                }

                // Property: Each session should have exactly the expected number of requests
                expect(session.requestHistory.length).toBe(requestsPerSession);
              });

              // Property: Sessions should not interfere with each other
              const requestCounts = Array.from(sessions.values()).map(s => s.requestHistory.length);
              requestCounts.forEach(count => {
                expect(count).toBe(requestsPerSession);
              });

              // Property: Total requests across all sessions should be correct
              const totalRequests = Array.from(sessions.values())
                .reduce((sum, s) => sum + s.requestHistory.length, 0);
              expect(totalRequests).toBe(sessionIds.length * requestsPerSession);
            }
          ),
          { numRuns: 100 } // Minimum 100 iterations as per requirements
        );
      });

      it('should maintain request tracking accuracy across multiple requests', () => {
        // Feature: agricultural-accuracy-and-security-fixes, Property 15: Request tracking
        
        fc.assert(
          fc.property(
            // Generate 1-5 requests
            fc.integer({ min: 1, max: 5 }),
            (numRequests) => {
              const jsonMock = jest.fn();
              const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
              const setHeaderMock = jest.fn();
              const nextFunction = jest.fn();

              const testRequest: Partial<Request> = {
                path: '/api/analysis',
                session: {
                  id: `test-session-${Date.now()}`,
                  requestHistory: [],
                  cookie: {} as any,
                  regenerate: jest.fn(),
                  destroy: jest.fn(),
                  reload: jest.fn(),
                  save: jest.fn(),
                  touch: jest.fn(),
                  resetMaxAge: jest.fn()
                } as any
              };

              const testResponse: Partial<Response> = {
                status: statusMock,
                json: jsonMock,
                setHeader: setHeaderMock
              };

              const timestamps: number[] = [];
              const startTime = Date.now();

              // Make the specified number of requests
              for (let i = 0; i < numRequests; i++) {
                const beforeTimestamp = Date.now();
                
                shortTermRateLimiter(
                  testRequest as Request,
                  testResponse as Response,
                  nextFunction
                );

                const afterTimestamp = Date.now();
                const recordedTimestamp = testRequest.session!.requestHistory![i].timestamp;

                // Property: Recorded timestamp should be within the request window
                expect(recordedTimestamp).toBeGreaterThanOrEqual(beforeTimestamp);
                expect(recordedTimestamp).toBeLessThanOrEqual(afterTimestamp);

                // Property: Recorded timestamp should be after start time
                expect(recordedTimestamp).toBeGreaterThanOrEqual(startTime);

                timestamps.push(recordedTimestamp);
              }

              // Property: Timestamps should be in non-decreasing order (monotonic)
              for (let i = 1; i < timestamps.length; i++) {
                expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
              }

              // Property: Request count should match number of requests made
              expect(testRequest.session!.requestHistory!.length).toBe(numRequests);

              // Property: All timestamps should be valid numbers
              timestamps.forEach(ts => {
                expect(typeof ts).toBe('number');
                expect(ts).toBeGreaterThan(0);
                expect(Number.isFinite(ts)).toBe(true);
              });
            }
          ),
          { numRuns: 100 } // Minimum 100 iterations as per requirements
        );
      });
    });
  });
});
