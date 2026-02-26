/**
 * Timezone Utilities
 * 
 * Provides timezone handling utilities for weather data and timestamp processing.
 * Requirements: 12.1, 12.2, 12.4, 12.5
 */

/**
 * Timezone validation result
 */
export interface TimezoneValidationResult {
  isValid: boolean;
  timezone: string | null;
  error?: string;
}

/**
 * Timezone-aware timestamp
 */
export interface TimezoneAwareTimestamp {
  utcTimestamp: Date;
  localTimestamp: string;
  timezone: string;
  offset: number; // Offset in minutes from UTC
}

/**
 * Daylight calculation result
 */
export interface DaylightInfo {
  isDaylight: boolean;
  hour: number;
  sunrise: number;
  sunset: number;
}

/**
 * User timezone information
 */
export interface UserTimezoneInfo {
  timezone: string;
  offset: number;
  detectionMethod: 'browser' | 'geolocation' | 'manual' | 'default';
}

/**
 * Validate timezone string
 * Requirement 12.2: Validate timezone information in all timestamps
 * 
 * @param timezone - Timezone string to validate (e.g., 'America/New_York', 'UTC', 'Europe/London')
 * @returns Validation result with isValid flag and normalized timezone
 */
export function validateTimezone(timezone: any): TimezoneValidationResult {
  // Handle null/undefined
  if (timezone === null || timezone === undefined) {
    return {
      isValid: false,
      timezone: null,
      error: 'Timezone is required'
    };
  }

  // Handle non-string values
  if (typeof timezone !== 'string') {
    return {
      isValid: false,
      timezone: null,
      error: 'Timezone must be a string'
    };
  }

  // Handle empty string
  if (timezone.trim() === '') {
    return {
      isValid: false,
      timezone: null,
      error: 'Timezone cannot be empty'
    };
  }

  const trimmedTimezone = timezone.trim();

  // Validate timezone format using Intl.DateTimeFormat
  try {
    // Try to create a DateTimeFormat with the timezone
    // This will throw if the timezone is invalid
    new Intl.DateTimeFormat('en-US', { timeZone: trimmedTimezone });
    
    return {
      isValid: true,
      timezone: trimmedTimezone
    };
  } catch (error) {
    return {
      isValid: false,
      timezone: null,
      error: `Invalid timezone: ${trimmedTimezone}`
    };
  }
}

/**
 * Convert timestamp to timezone-aware format
 * Requirement 12.4: Use timezone-aware timestamps for daylight calculations
 * Requirement 12.5: Display times in user's local timezone
 * 
 * @param timestamp - UTC timestamp
 * @param timezone - Target timezone (IANA timezone string)
 * @returns Timezone-aware timestamp with local time string and offset
 */
export function convertToTimezone(timestamp: Date, timezone: string): TimezoneAwareTimestamp {
  // Validate timezone first
  const validation = validateTimezone(timezone);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid timezone');
  }

  // Get the local time string in the target timezone
  const localTimestamp = timestamp.toLocaleString('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  // Calculate timezone offset in minutes
  // Create a date in the target timezone and compare with UTC
  const utcDate = new Date(timestamp.toISOString());
  const tzDate = new Date(timestamp.toLocaleString('en-US', { timeZone: timezone }));
  const offset = Math.round((tzDate.getTime() - utcDate.getTime()) / (1000 * 60));

  return {
    utcTimestamp: timestamp,
    localTimestamp,
    timezone,
    offset
  };
}

/**
 * Check if a given hour is during daylight
 * Requirement 12.4: Use timezone-aware timestamps for daylight calculations
 * 
 * Simple approximation: daylight is between 6 AM and 6 PM local time
 * For more accurate calculations, consider using a library like suncalc
 * 
 * @param timestamp - Timestamp to check
 * @param timezone - Timezone for the location
 * @param latitude - Optional latitude for more accurate sunrise/sunset calculation
 * @returns Daylight information
 */
export function isDaylightHour(
  timestamp: Date,
  timezone: string,
  latitude?: number
): DaylightInfo {
  // Convert to local time in the specified timezone
  const tzAware = convertToTimezone(timestamp, timezone);
  
  // Extract hour from local timestamp
  // Format is "MM/DD/YYYY, HH:mm:ss"
  const timePart = tzAware.localTimestamp.split(', ')[1];
  const hour = parseInt(timePart.split(':')[0], 10);

  // Simple approximation: daylight between 6 AM and 6 PM
  // This can be enhanced with actual sunrise/sunset calculations based on latitude
  let sunrise = 6;
  let sunset = 18;

  // Adjust for latitude if provided (rough approximation)
  if (latitude !== undefined) {
    // Higher latitudes have more variation in daylight hours
    // This is a very rough approximation
    const latAbs = Math.abs(latitude);
    if (latAbs > 60) {
      // Extreme latitudes: wider variation
      sunrise = 4;
      sunset = 20;
    } else if (latAbs > 45) {
      // Mid-high latitudes
      sunrise = 5;
      sunset = 19;
    }
  }

  const isDaylight = hour >= sunrise && hour < sunset;

  return {
    isDaylight,
    hour,
    sunrise,
    sunset
  };
}

/**
 * Detect user's timezone from browser
 * Requirement 12.3: Request user's timezone when missing
 * 
 * @returns User timezone information
 */
export function detectUserTimezone(): UserTimezoneInfo {
  try {
    // Try to get timezone from Intl API
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    if (timezone) {
      // Calculate current offset
      const now = new Date();
      const offset = -now.getTimezoneOffset(); // getTimezoneOffset returns negative values for positive offsets
      
      return {
        timezone,
        offset,
        detectionMethod: 'browser'
      };
    }
  } catch (error) {
    console.warn('Failed to detect timezone from browser:', error);
  }

  // Fallback to UTC
  return {
    timezone: 'UTC',
    offset: 0,
    detectionMethod: 'default'
  };
}

/**
 * Format timezone offset as string (e.g., "+05:30", "-08:00")
 * 
 * @param offsetMinutes - Offset in minutes from UTC
 * @returns Formatted offset string
 */
export function formatTimezoneOffset(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absOffset = Math.abs(offsetMinutes);
  const hours = Math.floor(absOffset / 60);
  const minutes = absOffset % 60;
  
  return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Validate that a timestamp has timezone information
 * Requirement 12.2: Validate timezone information in all timestamps
 * 
 * @param timestamp - Timestamp to validate
 * @param timezone - Associated timezone
 * @returns True if timestamp and timezone are valid
 */
export function validateTimestampWithTimezone(
  timestamp: Date | string,
  timezone: string
): boolean {
  // Validate timezone
  const tzValidation = validateTimezone(timezone);
  if (!tzValidation.isValid) {
    return false;
  }

  // Validate timestamp
  try {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Create weather API request parameters with explicit timezone
 * Requirement 12.1: Add explicit timezone parameter to weather API requests
 * 
 * @param latitude - Location latitude
 * @param longitude - Location longitude
 * @param timezone - Explicit timezone (defaults to 'auto' for API to determine)
 * @returns URL search parameters for weather API
 */
export function createWeatherAPIParams(
  latitude: number,
  longitude: number,
  timezone: string = 'auto'
): URLSearchParams {
  const params = new URLSearchParams();
  params.set('latitude', String(latitude));
  params.set('longitude', String(longitude));
  params.set('timezone', timezone);
  
  return params;
}

/**
 * Parse timezone from weather API response
 * Requirement 12.2: Validate timezone information in all timestamps
 * 
 * @param apiResponse - Weather API response object
 * @returns Validated timezone or null
 */
export function parseTimezoneFromWeatherAPI(apiResponse: any): string | null {
  if (!apiResponse || typeof apiResponse !== 'object') {
    return null;
  }

  const timezone = apiResponse.timezone;
  
  if (typeof timezone !== 'string') {
    return null;
  }

  const validation = validateTimezone(timezone);
  return validation.isValid ? validation.timezone : null;
}
 