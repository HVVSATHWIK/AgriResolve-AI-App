/**
 * Comprehensive Error Response Types
 * 
 * Standardized error response format for all API endpoints
 * Feature: agricultural-accuracy-and-security-fixes
 * Requirement 16.3: Provide user-friendly error messages
 */

/**
 * Error codes for different types of failures
 */
export enum ErrorCode {
  // Validation errors (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Authentication/Authorization errors (401, 403)
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_SESSION = 'INVALID_SESSION',
  
  // Rate limiting errors (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // Service availability errors (503)
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  SERVICE_DEGRADED = 'SERVICE_DEGRADED',
  GEMINI_API_UNAVAILABLE = 'GEMINI_API_UNAVAILABLE',
  WEATHER_API_UNAVAILABLE = 'WEATHER_API_UNAVAILABLE',
  
  // Internal errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  ANALYSIS_ERROR = 'ANALYSIS_ERROR',
  SANITIZATION_ERROR = 'SANITIZATION_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

/**
 * Service-specific error information
 */
export interface ServiceErrorInfo {
  service: string;
  available: boolean;
  message: string;
  retryable: boolean;
  retryAfter?: number; // seconds
}

/**
 * Comprehensive error response interface
 * Requirement 16.3: Include error codes, retryable flag, affected features
 */
export interface ErrorResponse {
  // Basic error information
  error: string;
  code: ErrorCode;
  message: string;
  timestamp: string;
  
  // Request context
  requestId?: string;
  path?: string;
  
  // Retry information
  retryable: boolean;
  retryAfter?: number; // seconds
  
  // Service degradation information
  serviceErrors?: ServiceErrorInfo[];
  affectedFeatures?: string[];
  
  // Validation errors
  validationErrors?: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
  
  // Rate limiting information
  rateLimitInfo?: {
    limit: number;
    remaining: number;
    resetTime: string;
    retryAfter: number;
  };
  
  // Additional context
  details?: Record<string, any>;
  
  // Support information
  supportMessage?: string;
  documentationUrl?: string;
}

/**
 * Create a validation error response
 */
export function createValidationError(
  message: string,
  validationErrors?: Array<{ field: string; message: string; value?: any }>
): ErrorResponse {
  return {
    error: 'Validation Error',
    code: ErrorCode.VALIDATION_ERROR,
    message,
    timestamp: new Date().toISOString(),
    retryable: false,
    validationErrors,
    supportMessage: 'Please check your input and try again.'
  };
}

/**
 * Create a rate limit error response
 */
export function createRateLimitError(
  limit: number,
  resetTime: Date,
  retryAfter: number
): ErrorResponse {
  return {
    error: 'Rate Limit Exceeded',
    code: ErrorCode.RATE_LIMIT_EXCEEDED,
    message: `You have exceeded the rate limit of ${limit} requests. Please try again later.`,
    timestamp: new Date().toISOString(),
    retryable: true,
    retryAfter,
    rateLimitInfo: {
      limit,
      remaining: 0,
      resetTime: resetTime.toISOString(),
      retryAfter
    },
    supportMessage: `Your quota will reset at ${resetTime.toISOString()}.`
  };
}

/**
 * Create a service unavailable error response
 */
export function createServiceUnavailableError(
  service: string,
  retryAfter: number = 300
): ErrorResponse {
  return {
    error: 'Service Unavailable',
    code: ErrorCode.SERVICE_UNAVAILABLE,
    message: `The ${service} service is currently unavailable. Please try again later.`,
    timestamp: new Date().toISOString(),
    retryable: true,
    retryAfter,
    serviceErrors: [{
      service,
      available: false,
      message: `${service} is temporarily unavailable`,
      retryable: true,
      retryAfter
    }],
    supportMessage: 'If the problem persists, please contact support.'
  };
}

/**
 * Create a service degraded error response
 */
export function createServiceDegradedError(
  serviceErrors: ServiceErrorInfo[],
  affectedFeatures: string[]
): ErrorResponse {
  const serviceNames = serviceErrors.map(e => e.service).join(' and ');
  const retryable = serviceErrors.some(e => e.retryable);
  const minRetryAfter = serviceErrors
    .filter(e => e.retryAfter !== undefined)
    .reduce((min, e) => Math.min(min, e.retryAfter!), Infinity);

  return {
    error: 'Service Degraded',
    code: ErrorCode.SERVICE_DEGRADED,
    message: `The ${serviceNames} service${serviceErrors.length > 1 ? 's are' : ' is'} currently unavailable. Some features may be limited.`,
    timestamp: new Date().toISOString(),
    retryable,
    retryAfter: minRetryAfter !== Infinity ? minRetryAfter : undefined,
    serviceErrors,
    affectedFeatures,
    supportMessage: 'You can continue using available features. Some functionality may be limited.'
  };
}

/**
 * Create an internal error response
 */
export function createInternalError(
  message: string = 'An internal error occurred',
  details?: Record<string, any>
): ErrorResponse {
  return {
    error: 'Internal Server Error',
    code: ErrorCode.INTERNAL_ERROR,
    message,
    timestamp: new Date().toISOString(),
    retryable: true,
    retryAfter: 60,
    details,
    supportMessage: 'Please try again later. If the problem persists, contact support.'
  };
}

/**
 * Create an analysis error response
 */
export function createAnalysisError(
  message: string = 'Failed to process analysis request',
  retryable: boolean = true
): ErrorResponse {
  return {
    error: 'Analysis Failed',
    code: ErrorCode.ANALYSIS_ERROR,
    message,
    timestamp: new Date().toISOString(),
    retryable,
    retryAfter: retryable ? 60 : undefined,
    supportMessage: retryable 
      ? 'Please try again. If the problem persists, contact support.'
      : 'Please check your input and try again.'
  };
}

/**
 * Create an unauthorized error response
 */
export function createUnauthorizedError(
  message: string = 'Authentication required'
): ErrorResponse {
  return {
    error: 'Unauthorized',
    code: ErrorCode.UNAUTHORIZED,
    message,
    timestamp: new Date().toISOString(),
    retryable: false,
    supportMessage: 'Please ensure you have a valid session.'
  };
}

/**
 * Convert any error to a standardized error response
 */
export function toErrorResponse(error: any, defaultMessage: string = 'An error occurred'): ErrorResponse {
  // If it's already an ErrorResponse, return it
  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    return error as ErrorResponse;
  }

  // Extract message from Error object
  const message = error?.message || defaultMessage;
  
  // Determine if retryable based on error type
  const retryable = !error?.code || ![400, 401, 403, 404, 422].includes(error.code);

  return {
    error: 'Error',
    code: ErrorCode.INTERNAL_ERROR,
    message,
    timestamp: new Date().toISOString(),
    retryable,
    retryAfter: retryable ? 60 : undefined
  };
}
