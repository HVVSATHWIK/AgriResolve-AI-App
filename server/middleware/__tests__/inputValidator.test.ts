import { Request, Response, NextFunction } from 'express';
import * as fc from 'fast-check';
import {
  sanitizeTextInput,
  validateCropType,
  validateImageType,
  validateImageSize,
  validateAnalysisRequest,
  validateFileUpload,
  validateWeatherData,
  SUPPORTED_CROP_TYPES
} from '../inputValidator.js';

// Mock logger
jest.mock('../../utils/logger.js', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Input Validator Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      body: {},
      session: {
        id: 'test-session-123',
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
      json: jsonMock
    };

    nextFunction = jest.fn();
  });

  describe('sanitizeTextInput', () => {
    it('should remove null bytes', () => {
      const input = 'test\0string';
      const result = sanitizeTextInput(input);
      expect(result).toBe('teststring');
    });

    it('should escape HTML special characters', () => {
      const input = '<script>alert("XSS")</script>';
      const result = sanitizeTextInput(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).not.toContain('"');
      // The ampersands in the escaped entities get escaped too, so we just verify dangerous chars are removed
    });

    it('should remove SQL injection patterns', () => {
      const input = "'; DROP TABLE users; --";
      const result = sanitizeTextInput(input);
      expect(result).not.toContain('DROP');
      expect(result).not.toContain('--');
    });

    it('should remove command injection patterns', () => {
      const input = '$(rm -rf /)';
      const result = sanitizeTextInput(input);
      expect(result).not.toContain('$(');
      expect(result).not.toContain(')');
    });

    it('should handle empty strings', () => {
      const result = sanitizeTextInput('');
      expect(result).toBe('');
    });

    it('should handle non-string inputs', () => {
      const result = sanitizeTextInput(123 as any);
      expect(result).toBe('');
    });

    it('should truncate very long strings', () => {
      const longString = 'a'.repeat(20000);
      const result = sanitizeTextInput(longString);
      expect(result.length).toBeLessThanOrEqual(10000);
    });
  });

  describe('validateCropType', () => {
    it('should accept valid crop types', () => {
      SUPPORTED_CROP_TYPES.forEach(cropType => {
        const result = validateCropType(cropType);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should accept crop types with different casing', () => {
      const result = validateCropType('TOMATO');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid crop types', () => {
      const result = validateCropType('banana');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported crop type');
    });

    it('should reject missing crop type', () => {
      const result = validateCropType(null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should reject non-string crop types', () => {
      const result = validateCropType(123);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be a string');
    });
  });

  describe('validateImageType', () => {
    it('should accept JPEG images', () => {
      const result = validateImageType('image/jpeg');
      expect(result.valid).toBe(true);
    });

    it('should accept PNG images', () => {
      const result = validateImageType('image/png');
      expect(result.valid).toBe(true);
    });

    it('should accept WebP images', () => {
      const result = validateImageType('image/webp');
      expect(result.valid).toBe(true);
    });

    it('should accept jpg mimetype', () => {
      const result = validateImageType('image/jpg');
      expect(result.valid).toBe(true);
    });

    it('should reject unsupported image formats', () => {
      const result = validateImageType('image/gif');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported image format');
    });

    it('should reject non-image types', () => {
      const result = validateImageType('application/pdf');
      expect(result.valid).toBe(false);
    });

    it('should handle case insensitivity', () => {
      const result = validateImageType('IMAGE/JPEG');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateImageSize', () => {
    it('should accept files under 10MB', () => {
      const result = validateImageSize(5 * 1024 * 1024); // 5MB
      expect(result.valid).toBe(true);
    });

    it('should accept files at exactly 10MB', () => {
      const result = validateImageSize(10 * 1024 * 1024); // 10MB
      expect(result.valid).toBe(true);
    });

    it('should reject files over 10MB', () => {
      const result = validateImageSize(11 * 1024 * 1024); // 11MB
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum');
    });

    it('should reject empty files', () => {
      const result = validateImageSize(0);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should reject negative file sizes', () => {
      const result = validateImageSize(-100);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file size');
    });

    it('should reject non-numeric sizes', () => {
      const result = validateImageSize('large' as any);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateAnalysisRequest', () => {
    it('should pass validation with valid crop type', () => {
      mockRequest.body = {
        cropType: 'tomato'
      };

      validateAnalysisRequest(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should fail validation without crop type', () => {
      mockRequest.body = {};

      validateAnalysisRequest(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'VALIDATION_ERROR',
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'cropType'
            })
          ])
        })
      );
    });

    it('should sanitize text inputs in notes field', () => {
      mockRequest.body = {
        cropType: 'tomato',
        notes: '<script>alert("XSS")</script>'
      };

      validateAnalysisRequest(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.body.notes).not.toContain('<script>');
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('validateFileUpload', () => {
    it('should pass validation with valid file', () => {
      mockRequest.file = {
        fieldname: 'image',
        originalname: 'crop.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 5 * 1024 * 1024, // 5MB
        buffer: Buffer.from(''),
        stream: null as any,
        destination: '',
        filename: '',
        path: ''
      };

      validateFileUpload(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should fail validation with oversized file', () => {
      mockRequest.file = {
        fieldname: 'image',
        originalname: 'large.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 15 * 1024 * 1024, // 15MB
        buffer: Buffer.from(''),
        stream: null as any,
        destination: '',
        filename: '',
        path: ''
      };

      validateFileUpload(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should fail validation with invalid file type', () => {
      mockRequest.file = {
        fieldname: 'image',
        originalname: 'document.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from(''),
        stream: null as any,
        destination: '',
        filename: '',
        path: ''
      };

      validateFileUpload(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe('validateWeatherData', () => {
    it('should pass validation with valid weather data', () => {
      mockRequest.body = {
        weatherData: {
          temperature: 25,
          relativeHumidity: 65,
          windSpeed: 5
        }
      };

      validateWeatherData(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should pass validation when weather data is missing', () => {
      mockRequest.body = {};

      validateWeatherData(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should fail validation with temperature below -50°C', () => {
      mockRequest.body = {
        weatherData: {
          temperature: -60
        }
      };

      validateWeatherData(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should fail validation with temperature above 60°C', () => {
      mockRequest.body = {
        weatherData: {
          temperature: 70
        }
      };

      validateWeatherData(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).not.toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  /**
   * Property-Based Tests
   * Feature: agricultural-accuracy-and-security-fixes
   */
  describe('Property-Based Tests', () => {
    /**
     * Property 20: Input sanitization
     * **Validates: Requirements 8.4**
     * 
     * For any user text input received by the system, the input should be 
     * sanitized to remove or escape characters that could enable injection attacks.
     */
    describe('Property 20: Input sanitization', () => {
      it('should sanitize any text input to prevent injection attacks', () => {
        // Feature: agricultural-accuracy-and-security-fixes, Property 20: Input sanitization
        
        fc.assert(
          fc.property(
            fc.string(),
            (input) => {
              const sanitized = sanitizeTextInput(input);

              // Property: Output should never contain dangerous HTML tags
              expect(sanitized).not.toMatch(/<script/i);
              expect(sanitized).not.toMatch(/<iframe/i);
              expect(sanitized).not.toMatch(/<object/i);
              expect(sanitized).not.toMatch(/<embed/i);

              // Property: Output should not contain SQL injection patterns
              expect(sanitized).not.toMatch(/DROP\s+TABLE/i);
              expect(sanitized).not.toMatch(/DELETE\s+FROM/i);
              expect(sanitized).not.toMatch(/INSERT\s+INTO/i);
              expect(sanitized).not.toMatch(/UPDATE\s+\w+\s+SET/i);

              // Property: Output should not contain command injection patterns
              expect(sanitized).not.toContain('$(');
              expect(sanitized).not.toContain('${');
              expect(sanitized).not.toContain('`');

              // Property: Output should not contain null bytes
              expect(sanitized).not.toContain('\0');

              // Property: Output length should not exceed maximum
              expect(sanitized.length).toBeLessThanOrEqual(10000);

              // Property: Output should be a string
              expect(typeof sanitized).toBe('string');
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    /**
     * Property 21: Image file type validation
     * **Validates: Requirements 8.5**
     * 
     * For any uploaded file, if the file type is not an accepted image format 
     * (JPEG, PNG, WebP), the upload should be rejected.
     */
    describe('Property 21: Image file type validation', () => {
      it('should accept only valid image formats', () => {
        // Feature: agricultural-accuracy-and-security-fixes, Property 21: Image file type validation
        
        fc.assert(
          fc.property(
            fc.constantFrom(
              'image/jpeg',
              'image/jpg',
              'image/png',
              'image/webp',
              'IMAGE/JPEG',
              'Image/PNG'
            ),
            (mimetype) => {
              const result = validateImageType(mimetype);

              // Property: Valid image types should always pass validation
              expect(result.valid).toBe(true);
              expect(result.error).toBeUndefined();
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should reject invalid file types', () => {
        // Feature: agricultural-accuracy-and-security-fixes, Property 21: Image file type validation
        
        fc.assert(
          fc.property(
            fc.constantFrom(
              'image/gif',
              'image/bmp',
              'image/tiff',
              'application/pdf',
              'text/plain',
              'video/mp4',
              'audio/mp3',
              'application/json',
              'text/html'
            ),
            (mimetype) => {
              const result = validateImageType(mimetype);

              // Property: Invalid file types should always fail validation
              expect(result.valid).toBe(false);
              expect(result.error).toBeDefined();
              expect(result.error).toContain('Unsupported');
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    /**
     * Property 22: Image file size validation
     * **Validates: Requirements 8.6**
     * 
     * For any uploaded file, if the file size exceeds 10MB, the upload should be rejected.
     */
    describe('Property 22: Image file size validation', () => {
      it('should accept files under or at 10MB limit', () => {
        // Feature: agricultural-accuracy-and-security-fixes, Property 22: Image file size validation
        
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 10 * 1024 * 1024 }),
            (fileSize) => {
              const result = validateImageSize(fileSize);

              // Property: Files at or under 10MB should pass validation
              expect(result.valid).toBe(true);
              expect(result.error).toBeUndefined();
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should reject files over 10MB limit', () => {
        // Feature: agricultural-accuracy-and-security-fixes, Property 22: Image file size validation
        
        fc.assert(
          fc.property(
            fc.integer({ min: 10 * 1024 * 1024 + 1, max: 100 * 1024 * 1024 }),
            (fileSize) => {
              const result = validateImageSize(fileSize);

              // Property: Files over 10MB should fail validation
              expect(result.valid).toBe(false);
              expect(result.error).toBeDefined();
              expect(result.error).toContain('exceeds maximum');
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should reject invalid file sizes', () => {
        // Feature: agricultural-accuracy-and-security-fixes, Property 22: Image file size validation
        
        fc.assert(
          fc.property(
            fc.integer({ min: -1000, max: 0 }),
            (fileSize) => {
              const result = validateImageSize(fileSize);

              // Property: Zero or negative sizes should fail validation
              expect(result.valid).toBe(false);
              expect(result.error).toBeDefined();
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });
});
