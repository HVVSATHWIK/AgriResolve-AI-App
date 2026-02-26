import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

/**
 * Supported crop types for validation
 * Requirement 4.3: System shall support crop types including tomato, potato, wheat, corn, soybean, grape, and apple
 */
export const SUPPORTED_CROP_TYPES = [
  'tomato',
  'potato',
  'wheat',
  'corn',
  'soybean',
  'grape',
  'apple'
] as const;

export type CropType = typeof SUPPORTED_CROP_TYPES[number];

/**
 * Supported image MIME types
 * Requirement 8.5: System shall validate file type is an accepted image format
 */
const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

/**
 * Maximum file size in bytes (10MB)
 * Requirement 8.6: System shall validate file size does not exceed 10MB
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validation error response interface
 */
interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Sanitize text input to prevent injection attacks
 * Requirement 8.4: System shall sanitize input to prevent injection attacks
 * 
 * This function removes or escapes potentially dangerous characters that could
 * be used in SQL injection, XSS, or command injection attacks.
 */
export const sanitizeTextInput = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');

  // Escape HTML special characters to prevent XSS
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  // Remove potential SQL injection patterns
  // Remove SQL keywords in dangerous contexts
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/gi,
    /(--|;|\/\*|\*\/)/g, // SQL comment patterns
    /(\bOR\b\s+\d+\s*=\s*\d+)/gi, // OR 1=1 patterns
    /(\bAND\b\s+\d+\s*=\s*\d+)/gi // AND 1=1 patterns
  ];

  sqlPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Remove potential command injection patterns
  const commandPatterns = [
    /[;&|`$(){}[\]]/g, // Shell metacharacters
    /\$\{.*?\}/g, // Variable expansion
    /\$\(.*?\)/g // Command substitution
  ];

  commandPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Limit length to prevent buffer overflow attacks
  const MAX_TEXT_LENGTH = 10000;
  if (sanitized.length > MAX_TEXT_LENGTH) {
    sanitized = sanitized.substring(0, MAX_TEXT_LENGTH);
  }

  return sanitized.trim();
};

/**
 * Validate crop type
 * Requirement 8.4: Validate crop type against supported types
 */
export const validateCropType = (cropType: any): { valid: boolean; error?: string } => {
  if (!cropType) {
    return {
      valid: false,
      error: 'Crop type is required'
    };
  }

  if (typeof cropType !== 'string') {
    return {
      valid: false,
      error: 'Crop type must be a string'
    };
  }

  const normalizedCropType = cropType.toLowerCase().trim();

  if (!SUPPORTED_CROP_TYPES.includes(normalizedCropType as CropType)) {
    return {
      valid: false,
      error: `Unsupported crop type. Supported types: ${SUPPORTED_CROP_TYPES.join(', ')}`
    };
  }

  return { valid: true };
};

/**
 * Validate image file type
 * Requirement 8.5: System shall validate file type is an accepted image format
 */
export const validateImageType = (mimetype: string): { valid: boolean; error?: string } => {
  if (!mimetype) {
    return {
      valid: false,
      error: 'File type is required'
    };
  }

  const normalizedType = mimetype.toLowerCase();

  if (!SUPPORTED_IMAGE_TYPES.includes(normalizedType)) {
    return {
      valid: false,
      error: `Unsupported image format. Supported formats: JPEG, PNG, WebP`
    };
  }

  return { valid: true };
};

/**
 * Validate image file size
 * Requirement 8.6: System shall validate file size does not exceed 10MB
 */
export const validateImageSize = (size: number): { valid: boolean; error?: string } => {
  if (typeof size !== 'number' || size < 0) {
    return {
      valid: false,
      error: 'Invalid file size'
    };
  }

  if (size === 0) {
    return {
      valid: false,
      error: 'File is empty'
    };
  }

  if (size > MAX_FILE_SIZE) {
    const sizeMB = (size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size (${sizeMB}MB) exceeds maximum allowed size of 10MB`
    };
  }

  return { valid: true };
};

/**
 * Validate request structure for analysis endpoint
 * Ensures all required fields are present and valid
 */
export const validateAnalysisRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors: ValidationError[] = [];

  // Validate request body exists
  if (!req.body) {
    res.status(400).json({
      error: 'Invalid Request',
      code: 'VALIDATION_ERROR',
      message: 'Request body is required',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Validate crop type
  const { cropType } = req.body;
  const cropValidation = validateCropType(cropType);
  if (!cropValidation.valid) {
    errors.push({
      field: 'cropType',
      message: cropValidation.error!,
      value: cropType
    });
  }

  // Validate image data if present in body
  if (req.body.image) {
    // Check if image is base64 encoded
    if (typeof req.body.image === 'string') {
      // Extract MIME type from data URL if present
      const dataUrlMatch = req.body.image.match(/^data:(image\/[a-z]+);base64,/);
      if (dataUrlMatch) {
        const mimetype = dataUrlMatch[1];
        const imageValidation = validateImageType(mimetype);
        if (!imageValidation.valid) {
          errors.push({
            field: 'image',
            message: imageValidation.error!
          });
        }

        // Calculate approximate size from base64
        const base64Data = req.body.image.split(',')[1] || req.body.image;
        const approximateSize = (base64Data.length * 3) / 4;
        const sizeValidation = validateImageSize(approximateSize);
        if (!sizeValidation.valid) {
          errors.push({
            field: 'image',
            message: sizeValidation.error!
          });
        }
      }
    }
  }

  // Validate and sanitize text inputs
  if (req.body.notes) {
    req.body.notes = sanitizeTextInput(req.body.notes);
  }

  if (req.body.location) {
    if (typeof req.body.location === 'string') {
      req.body.location = sanitizeTextInput(req.body.location);
    } else if (typeof req.body.location === 'object') {
      // Sanitize location object fields
      if (req.body.location.name) {
        req.body.location.name = sanitizeTextInput(req.body.location.name);
      }
      if (req.body.location.address) {
        req.body.location.address = sanitizeTextInput(req.body.location.address);
      }
    }
  }

  // If there are validation errors, return them
  if (errors.length > 0) {
    logger.warn('Input validation failed:', { errors, sessionId: req.session?.id });
    res.status(400).json({
      error: 'Validation Error',
      code: 'VALIDATION_ERROR',
      message: 'One or more fields failed validation',
      errors,
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Validation passed
  logger.debug('Input validation passed', { sessionId: req.session?.id });
  next();
};

/**
 * Middleware to validate file uploads (for multipart/form-data)
 * This should be used with multer or similar file upload middleware
 */
export const validateFileUpload = (req: Request, res: Response, next: NextFunction): void => {
  const errors: ValidationError[] = [];

  // Check if file was uploaded
  if (!req.file && !req.files) {
    res.status(400).json({
      error: 'Validation Error',
      code: 'VALIDATION_ERROR',
      message: 'No file uploaded',
      timestamp: new Date().toISOString()
    });
    return;
  }

  const file = req.file || (Array.isArray(req.files) ? req.files[0] : req.files?.image);

  if (!file) {
    res.status(400).json({
      error: 'Validation Error',
      code: 'VALIDATION_ERROR',
      message: 'No image file found in upload',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Validate file type
  const typeValidation = validateImageType(file.mimetype);
  if (!typeValidation.valid) {
    errors.push({
      field: 'file',
      message: typeValidation.error!,
      value: file.mimetype
    });
  }

  // Validate file size
  const sizeValidation = validateImageSize(file.size);
  if (!sizeValidation.valid) {
    errors.push({
      field: 'file',
      message: sizeValidation.error!,
      value: `${(file.size / (1024 * 1024)).toFixed(2)}MB`
    });
  }

  // If there are validation errors, return them
  if (errors.length > 0) {
    logger.warn('File upload validation failed:', { errors, sessionId: req.session?.id });
    res.status(400).json({
      error: 'Validation Error',
      code: 'VALIDATION_ERROR',
      message: 'File upload validation failed',
      errors,
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Validation passed
  logger.debug('File upload validation passed', { 
    filename: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
    sessionId: req.session?.id 
  });
  next();
};

/**
 * Generic text input sanitization middleware
 * Sanitizes all string fields in request body
 */
export const sanitizeRequestBody = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.body || typeof req.body !== 'object') {
    return next();
  }

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeTextInput(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObject(item));
    }

    if (obj !== null && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  };

  req.body = sanitizeObject(req.body);
  next();
};

/**
 * Validate weather data inputs
 * Requirements 8.1, 8.2, 8.3: Validate temperature, humidity, and wind speed ranges
 */
export const validateWeatherData = (req: Request, res: Response, next: NextFunction): void => {
  const errors: ValidationError[] = [];
  const { weatherData } = req.body;

  if (!weatherData) {
    // Weather data is optional, so we don't fail if it's missing
    return next();
  }

  // Validate temperature (-50°C to 60°C)
  if (weatherData.temperature !== undefined && weatherData.temperature !== null) {
    const temp = Number(weatherData.temperature);
    if (isNaN(temp) || temp < -50 || temp > 60) {
      errors.push({
        field: 'weatherData.temperature',
        message: 'Temperature must be between -50°C and 60°C',
        value: weatherData.temperature
      });
    }
  }

  // Validate relative humidity (0% to 100%)
  if (weatherData.relativeHumidity !== undefined && weatherData.relativeHumidity !== null) {
    const humidity = Number(weatherData.relativeHumidity);
    if (isNaN(humidity) || humidity < 0 || humidity > 100) {
      errors.push({
        field: 'weatherData.relativeHumidity',
        message: 'Relative humidity must be between 0% and 100%',
        value: weatherData.relativeHumidity
      });
    }
  }

  // Validate wind speed (non-negative)
  if (weatherData.windSpeed !== undefined && weatherData.windSpeed !== null) {
    const windSpeed = Number(weatherData.windSpeed);
    if (isNaN(windSpeed) || windSpeed < 0) {
      errors.push({
        field: 'weatherData.windSpeed',
        message: 'Wind speed must be non-negative',
        value: weatherData.windSpeed
      });
    }
  }

  if (errors.length > 0) {
    logger.warn('Weather data validation failed:', { errors, sessionId: req.session?.id });
    res.status(400).json({
      error: 'Validation Error',
      code: 'VALIDATION_ERROR',
      message: 'Weather data validation failed',
      errors,
      timestamp: new Date().toISOString()
    });
    return;
  }

  next();
};
