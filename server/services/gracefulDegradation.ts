/**
 * Graceful Degradation Service
 * 
 * Handles service failures gracefully by providing fallback mechanisms
 * and clear error messaging
 * 
 * Feature: agricultural-accuracy-and-security-fixes
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5
 */

import { logger } from '../utils/logger.js';
import { 
  ErrorResponse, 
  ErrorCode,
  createServiceDegradedError,
  type ServiceErrorInfo 
} from '../types/errorResponse.js';

export interface ServiceError {
  service: 'gemini' | 'weather';
  available: boolean;
  message: string;
  retryable: boolean;
  retryAfter?: number;
}

export interface AnalysisCache {
  imageHash: string;
  result: any;
  timestamp: Date;
  expiresAt: Date;
}

export interface ManualWeatherData {
  temperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
  source: 'manual';
}

/**
 * Simple in-memory cache for analysis results
 * In production, this should be replaced with Redis or similar
 */
class AnalysisResultCache {
  private cache: Map<string, AnalysisCache> = new Map();
  private readonly MAX_CACHE_SIZE = 100;
  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Store analysis result in cache
   */
  set(imageHash: string, result: any): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const now = new Date();
    this.cache.set(imageHash, {
      imageHash,
      result,
      timestamp: now,
      expiresAt: new Date(now.getTime() + this.CACHE_TTL_MS)
    });

    logger.debug('Cached analysis result', { imageHash, cacheSize: this.cache.size });
  }

  /**
   * Retrieve cached analysis result
   */
  get(imageHash: string): any | null {
    const cached = this.cache.get(imageHash);
    
    if (!cached) {
      return null;
    }

    // Check if expired
    if (new Date() > cached.expiresAt) {
      this.cache.delete(imageHash);
      logger.debug('Expired cache entry removed', { imageHash });
      return null;
    }

    logger.debug('Cache hit', { imageHash, age: Date.now() - cached.timestamp.getTime() });
    return cached.result;
  }

  /**
   * Clear all cached results
   */
  clear(): void {
    this.cache.clear();
    logger.debug('Analysis cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE
    };
  }
}

// Singleton cache instance
const analysisCache = new AnalysisResultCache();

/**
 * Generate a simple hash for image data
 * In production, use a proper hashing algorithm like SHA-256
 */
function hashImage(imageData: string): string {
  // Simple hash for demo - in production use crypto.createHash('sha256')
  let hash = 0;
  for (let i = 0; i < Math.min(imageData.length, 1000); i++) {
    const char = imageData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Handle Gemini API unavailability
 * Requirement 16.1: Display cached or basic analysis if Gemini API unavailable
 */
export function handleGeminiUnavailable(imageData?: string): {
  useCached: boolean;
  cachedResult: any | null;
  error: ServiceError;
} {
  let cachedResult = null;
  let useCached = false;

  // Try to retrieve cached result if image data is provided
  if (imageData) {
    const imageHash = hashImage(imageData);
    cachedResult = analysisCache.get(imageHash);
    useCached = cachedResult !== null;
  }

  const error: ServiceError = {
    service: 'gemini',
    available: false,
    message: useCached 
      ? 'Gemini API is currently unavailable. Showing cached analysis from previous request.'
      : 'Gemini API is currently unavailable. Please try again later or contact support if the issue persists.',
    retryable: true,
    retryAfter: 300 // 5 minutes
  };

  logger.warn('Gemini API unavailable', { 
    useCached, 
    hasCachedResult: cachedResult !== null 
  });

  return { useCached, cachedResult, error };
}

/**
 * Handle Weather API unavailability
 * Requirement 16.2: Allow manual weather data entry when weather API unavailable
 */
export function handleWeatherUnavailable(manualData?: ManualWeatherData): {
  useManual: boolean;
  weatherData: ManualWeatherData | null;
  error: ServiceError;
} {
  const useManual = manualData !== undefined && manualData !== null;

  const error: ServiceError = {
    service: 'weather',
    available: false,
    message: useManual
      ? 'Weather API is currently unavailable. Using manually entered weather data.'
      : 'Weather API is currently unavailable. You can manually enter weather data to continue with analysis.',
    retryable: true,
    retryAfter: 300 // 5 minutes
  };

  logger.warn('Weather API unavailable', { 
    useManual, 
    hasManualData: manualData !== undefined 
  });

  return { 
    useManual, 
    weatherData: useManual ? manualData : null, 
    error 
  };
}

/**
 * Cache analysis result for future use
 * Requirement 16.1: Store results for cached fallback
 */
export function cacheAnalysisResult(imageData: string, result: any): void {
  const imageHash = hashImage(imageData);
  analysisCache.set(imageHash, result);
}

/**
 * Create error response for service failure
 * Requirement 16.3: Display specific error message indicating which service is unavailable
 */
export function createServiceErrorResponse(errors: ServiceError[]): ErrorResponse {
  const affectedFeatures: string[] = [];
  const serviceErrorInfos: ServiceErrorInfo[] = [];

  errors.forEach(err => {
    if (err.service === 'gemini') {
      affectedFeatures.push('AI-powered image analysis');
      affectedFeatures.push('Disease identification');
    }
    if (err.service === 'weather') {
      affectedFeatures.push('Weather-based risk assessment');
      affectedFeatures.push('Leaf wetness calculation');
    }

    serviceErrorInfos.push({
      service: err.service,
      available: err.available,
      message: err.message,
      retryable: err.retryable,
      retryAfter: err.retryAfter
    });
  });

  return createServiceDegradedError(serviceErrorInfos, affectedFeatures);
}

/**
 * Check if analysis can proceed with partial data
 * Requirement 16.4: Continue to provide other available features
 */
export function canProceedWithPartialData(
  geminiAvailable: boolean,
  weatherAvailable: boolean,
  hasCachedGemini: boolean,
  hasManualWeather: boolean
): {
  canProceed: boolean;
  limitations: string[];
} {
  const limitations: string[] = [];

  // Can proceed if we have either real or cached Gemini results
  const hasGeminiData = geminiAvailable || hasCachedGemini;
  
  // Can proceed if we have either real or manual weather data
  const hasWeatherData = weatherAvailable || hasManualWeather;

  if (!hasGeminiData) {
    limitations.push('AI-powered analysis unavailable - no cached results available');
  } else if (!geminiAvailable && hasCachedGemini) {
    limitations.push('Using cached AI analysis from previous request');
  }

  if (!hasWeatherData) {
    limitations.push('Weather-based risk assessment unavailable - no manual data provided');
  } else if (!weatherAvailable && hasManualWeather) {
    limitations.push('Using manually entered weather data');
  }

  // Can proceed if we have at least one data source
  const canProceed = hasGeminiData || hasWeatherData;

  return { canProceed, limitations };
}

/**
 * Validate manual weather data
 * Requirement 16.2: Validate manually entered weather data
 */
export function validateManualWeatherData(data: any): {
  valid: boolean;
  errors: string[];
  data: ManualWeatherData | null;
} {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      errors: ['Manual weather data must be an object'],
      data: null
    };
  }

  const temperature = data.temperature;
  const humidity = data.humidity;
  const windSpeed = data.windSpeed;

  // Validate temperature (-50°C to 60°C)
  if (temperature !== null && temperature !== undefined) {
    if (typeof temperature !== 'number' || temperature < -50 || temperature > 60) {
      errors.push('Temperature must be between -50°C and 60°C');
    }
  }

  // Validate humidity (0% to 100%)
  if (humidity !== null && humidity !== undefined) {
    if (typeof humidity !== 'number' || humidity < 0 || humidity > 100) {
      errors.push('Humidity must be between 0% and 100%');
    }
  }

  // Validate wind speed (non-negative)
  if (windSpeed !== null && windSpeed !== undefined) {
    if (typeof windSpeed !== 'number' || windSpeed < 0) {
      errors.push('Wind speed must be non-negative');
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, data: null };
  }

  return {
    valid: true,
    errors: [],
    data: {
      temperature: temperature ?? null,
      humidity: humidity ?? null,
      windSpeed: windSpeed ?? null,
      source: 'manual'
    }
  };
}

// Export cache for testing
export { analysisCache };
