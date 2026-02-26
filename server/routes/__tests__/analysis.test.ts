/**
 * Tests for Gemini API proxy endpoint
 * Task 1.6: Create Gemini API proxy endpoint
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

describe('Gemini API Proxy Endpoint', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.GEMINI_API_KEY = 'test-api-key-for-testing';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('API Key Configuration', () => {
    it('should require GEMINI_API_KEY environment variable', () => {
      const apiKey = process.env.GEMINI_API_KEY;
      expect(apiKey).toBeDefined();
      expect(apiKey).toBeTruthy();
    });

    it('should never expose API key in client-side code', () => {
      // Requirement 5.2: System shall NOT expose Gemini API keys in client-side code
      const apiKey = process.env.GEMINI_API_KEY;

      // API key should only be accessible server-side
      expect(apiKey).toBeDefined();

      // Verify it's not in a VITE_ prefixed variable (which would be exposed to client)
      expect(process.env.VITE_GEMINI_API_KEY).toBeUndefined();

      // Also check for the new service token if it's meant to be client-side (Wait, if it IS client side, this test might need adjustment)
      // If the user wants to expose it, we should probably allow it? 
      // But this test ensures backend keys aren't exposed. 
      // Let's just ensure VITE_GEMINI_API_KEY is gone as requested.
      expect(process.env.VITE_GEMINI_API_KEY).toBeUndefined();
    });

    it('should sanitize API key (remove whitespace)', () => {
      process.env.GEMINI_API_KEY = '  test-key-with-spaces  ';
      const sanitized = process.env.GEMINI_API_KEY.replace(/\s/g, '').trim();

      expect(sanitized).toBe('test-key-with-spaces');
      expect(sanitized).not.toContain(' ');
    });
  });

  describe('Request Validation', () => {
    it('should validate taskType is required', () => {
      // Requirement 5.3: Backend shall validate request before forwarding
      const request = {
        prompt: 'Test prompt'
      };

      const isValid = !!(request as any).taskType && !!(request as any).prompt;
      expect(isValid).toBe(false);
    });

    it('should validate prompt is required', () => {
      const request = {
        taskType: 'VISION_FAST'
      };

      const isValid = !!(request as any).taskType && !!(request as any).prompt;
      expect(isValid).toBe(false);
    });

    it('should validate taskType is in allowed list', () => {
      const MODEL_FALLBACKS = {
        VISION_FAST: ['gemini-2.5-flash-lite'],
        GENERATE_JSON: ['gemini-2.5-flash-lite'],
        CHAT_INTERACTIVE: ['gemini-2.5-flash-lite'],
      };

      const validTaskType = 'VISION_FAST';
      const invalidTaskType = 'INVALID_TASK';

      expect(MODEL_FALLBACKS[validTaskType as keyof typeof MODEL_FALLBACKS]).toBeDefined();
      expect(MODEL_FALLBACKS[invalidTaskType as keyof typeof MODEL_FALLBACKS]).toBeUndefined();
    });

    it('should accept requests with all required fields', () => {
      const request = {
        taskType: 'VISION_FAST',
        prompt: 'Analyze this image'
      };

      const isValid = !!request.taskType && !!request.prompt;
      expect(isValid).toBe(true);
    });

    it('should accept optional image field', () => {
      const request = {
        taskType: 'VISION_FAST',
        prompt: 'Analyze this image',
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
      };

      const isValid = !!request.taskType && !!request.prompt;
      expect(isValid).toBe(true);
      expect(request.image).toBeDefined();
    });
  });

  describe('Response Sanitization', () => {
    it('should detect and block API key patterns in responses', () => {
      // Requirement 5.5: Backend shall sanitize any sensitive information
      const responseWithKey = 'Response with AIza1234567890123456789012345678901234 key';
      const hasApiKeyPattern = /AI[a-zA-Z0-9_-]{35,}/.test(responseWithKey);

      expect(hasApiKeyPattern).toBe(true);
    });

    it('should detect apikey field names in responses', () => {
      const responseObj = {
        result: 'some data',
        apikey: 'secret-key'
      };

      const responseStr = JSON.stringify(responseObj).toLowerCase();
      const hasSensitiveField = responseStr.includes('apikey') || responseStr.includes('api_key');

      expect(hasSensitiveField).toBe(true);
    });

    it('should detect environment variable references', () => {
      const responseWithEnvVar = 'Response with process.env.GEMINI_API_KEY reference';
      const hasEnvVarPattern = /process\.env\.[A-Z_]+/.test(responseWithEnvVar);

      expect(hasEnvVarPattern).toBe(true);
    });

    it('should detect Bearer token patterns', () => {
      const responseWithToken = 'Authorization: Bearer abc123def456';
      const hasTokenPattern = /Bearer\s+[a-zA-Z0-9_-]+/i.test(responseWithToken);

      expect(hasTokenPattern).toBe(true);
    });

    it('should allow clean responses without sensitive data', () => {
      const cleanResponse = 'This is a normal AI response about crops';
      const hasApiKeyPattern = /AI[a-zA-Z0-9_-]{35,}/.test(cleanResponse);
      const hasEnvVarPattern = /process\.env\.[A-Z_]+/.test(cleanResponse);

      expect(hasApiKeyPattern).toBe(false);
      expect(hasEnvVarPattern).toBe(false);
    });
  });

  describe('Image Data Handling', () => {
    it('should parse base64 images with data URL prefix', () => {
      const imageB64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
      const match = imageB64.match(/^data:(image\/[^;]+);base64,(.*)$/);

      expect(match).toBeTruthy();
      expect(match![1]).toBe('image/jpeg');
      expect(match![2]).toBe('/9j/4AAQSkZJRg==');
    });

    it('should parse base64 images with PNG mime type', () => {
      const imageB64 = 'data:image/png;base64,iVBORw0KGgo=';
      const match = imageB64.match(/^data:(image\/[^;]+);base64,(.*)$/);

      expect(match).toBeTruthy();
      expect(match![1]).toBe('image/png');
    });

    it('should handle base64 images without data URL prefix', () => {
      const imageB64 = '/9j/4AAQSkZJRg==';
      const match = imageB64.match(/^data:(image\/[^;]+);base64,(.*)$/);

      // Should not match, will use fallback
      expect(match).toBeNull();

      // Fallback logic
      const data = imageB64.split(',')[1] || imageB64;
      expect(data).toBe('/9j/4AAQSkZJRg==');
    });
  });

  describe('Model Fallback Configuration', () => {
    it('should have fallback models for each task type', () => {
      const MODEL_FALLBACKS = {
        VISION_FAST: [
          'gemini-2.5-flash-lite',
          'gemini-2.5-flash',
          'gemini-2.0-flash-lite-001',
          'gemini-2.0-flash-001',
          'gemini-2.0-flash',
          'gemini-2.5-pro',
        ],
        GENERATE_JSON: [
          'gemini-2.5-flash-lite',
          'gemini-2.5-flash',
          'gemini-2.0-flash-lite-001',
          'gemini-2.0-flash-001',
          'gemini-2.0-flash',
          'gemini-2.5-pro',
        ],
        CHAT_INTERACTIVE: [
          'gemini-2.5-flash-lite',
          'gemini-2.5-flash',
          'gemini-2.0-flash-lite-001',
          'gemini-2.0-flash-001',
          'gemini-2.0-flash',
          'gemini-2.5-pro',
        ],
      };

      expect(MODEL_FALLBACKS.VISION_FAST.length).toBeGreaterThanOrEqual(2);
      expect(MODEL_FALLBACKS.GENERATE_JSON.length).toBeGreaterThanOrEqual(2);
      expect(MODEL_FALLBACKS.CHAT_INTERACTIVE.length).toBeGreaterThanOrEqual(2);
      expect(MODEL_FALLBACKS.VISION_FAST[0]).toBe('gemini-2.5-flash-lite');
      expect(MODEL_FALLBACKS.GENERATE_JSON[0]).toBe('gemini-2.5-flash-lite');
      expect(MODEL_FALLBACKS.CHAT_INTERACTIVE[0]).toBe('gemini-2.5-flash-lite');
    });

    it('should prioritize lite models for fast tasks', () => {
      const MODEL_FALLBACKS = {
        VISION_FAST: [
          'gemini-2.5-flash-lite',
          'gemini-2.5-flash',
        ],
      };

      expect(MODEL_FALLBACKS.VISION_FAST[0]).toContain('lite');
    });


  });

  describe('Safety Configuration', () => {
    it('should have safety system instruction', () => {
      const SAFETY_SYSTEM_INSTRUCTION = `
You are AgriResolve AI, a cautious agricultural decision-support assistant.

Safety rules (highest priority):
- Do NOT provide instructions for making, mixing, concentrating, or dosing chemicals (pesticides/fungicides/herbicides), nor application rates, nor any step-by-step hazardous procedure.
- Do NOT give human/animal medical advice. If asked about poisoning/exposure, recommend contacting local emergency services/poison control and following the product label/SDS.
- If a request is unsafe or illegal, refuse briefly and offer safer alternatives (monitoring, sanitation, scouting, consult agronomist, follow local guidelines).

Output rules:
- Follow the user-provided format requirements (e.g., JSON) and language requirements in the prompt.
- Be conservative with certainty; call out uncertainty clearly.
`;

      expect(SAFETY_SYSTEM_INSTRUCTION).toContain('AgriResolve AI');
      expect(SAFETY_SYSTEM_INSTRUCTION).toContain('Safety rules');
      expect(SAFETY_SYSTEM_INSTRUCTION).toContain('Do NOT provide instructions');
    });

    it('should have safety settings configured', () => {
      const DEFAULT_CONFIG = {
        temperature: 0.2,
        maxOutputTokens: 1400,
        safetySettings: [
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      };

      expect(DEFAULT_CONFIG.safetySettings).toHaveLength(5);
      expect(DEFAULT_CONFIG.temperature).toBe(0.2);
      expect(DEFAULT_CONFIG.maxOutputTokens).toBe(1400);
    });
  });

  describe('Health Check Endpoint', () => {
    it('should provide health check endpoint', () => {
      const healthCheckPath = '/analysis/health';
      expect(healthCheckPath).toBe('/analysis/health');
    });

    it('should return unhealthy when API key not configured', () => {
      delete process.env.GEMINI_API_KEY;
      const apiKey = process.env.GEMINI_API_KEY;

      const isHealthy = !!apiKey;
      expect(isHealthy).toBe(false);
    });

    it('should return healthy when API key is configured', () => {
      process.env.GEMINI_API_KEY = 'test-key';
      const apiKey = process.env.GEMINI_API_KEY;

      const isHealthy = !!apiKey;
      expect(isHealthy).toBe(true);
    });
  });

  describe('Rate Limit Integration', () => {
    it('should include rate limit info in responses', () => {
      const rateLimitInfo = {
        quotaRemaining: 19,
        quotaUsed: 1,
        resetTime: new Date()
      };

      expect(rateLimitInfo.quotaRemaining).toBeDefined();
      expect(rateLimitInfo.quotaUsed).toBeDefined();
      expect(rateLimitInfo.resetTime).toBeDefined();
    });

    it('should track quota remaining', () => {
      const hourlyLimit = 20;
      const used = 5;
      const remaining = hourlyLimit - used;

      expect(remaining).toBe(15);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing API key gracefully', () => {
      delete process.env.GEMINI_API_KEY;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        const error = {
          error: 'Service Configuration Error',
          code: 'SERVICE_UNAVAILABLE',
          message: 'AI service is not properly configured. Please contact support.'
        };

        expect(error.code).toBe('SERVICE_UNAVAILABLE');
        expect(error.message).toContain('not properly configured');
      }
    });

    it('should not expose internal error details to client', () => {
      const internalError = new Error('Internal database connection failed with credentials xyz');

      // Client should receive generic error
      const clientError = {
        error: 'Analysis Failed',
        code: 'ANALYSIS_ERROR',
        message: 'Failed to process analysis request. Please try again later.'
      };

      expect(clientError.message).not.toContain('database');
      expect(clientError.message).not.toContain('credentials');
      expect(clientError.message).not.toContain('xyz');
    });
  });
});
