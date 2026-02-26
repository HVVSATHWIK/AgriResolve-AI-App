/**
 * Weather Data Validator
 * 
 * Validates weather data ranges and handles missing values as null rather than fallback values.
 * Requirements: 8.1, 8.2, 8.3, 11.1, 11.2, 12.2
 */

import { validateTimezone, validateTimestampWithTimezone } from './timezoneUtils.js';

/**
 * Data quality levels based on completeness of weather data
 */
export enum DataQuality {
  COMPLETE = 'complete',
  PARTIAL = 'partial',
  INSUFFICIENT = 'insufficient'
}

/**
 * Raw weather data from external APIs (before validation)
 */
export interface RawWeatherData {
  temperature?: any;
  relativeHumidity?: any;
  windSpeed?: any;
  dewPoint?: any;
  timestamp: string | Date;
  timezone?: string;
}

/**
 * Validated weather data with null for missing/invalid values
 */
export interface ValidatedWeatherData {
  temperature: number | null;
  relativeHumidity: number | null;
  windSpeed: number | null;
  dewPoint: number | null;
  timestamp: Date;
  timezone: string;
  dataQuality: DataQuality;
}

/**
 * Data availability assessment
 */
export interface DataAvailability {
  hasTemperature: boolean;
  hasHumidity: boolean;
  hasWindSpeed: boolean;
  canCalculateRisk: boolean;
  missingFields: string[];
}

/**
 * WeatherValidator class
 * 
 * Validates weather data ranges and handles missing values as null.
 * Requirements:
 * - 8.1: Validate temperature values are within range -50°C to 60°C
 * - 8.2: Validate relative humidity values are within range 0% to 100%
 * - 8.3: Validate wind speed values are non-negative
 * - 11.1: Set missing temperature data to null
 * - 11.2: Set missing humidity data to null
 */
export class WeatherValidator {
  /**
   * Validate temperature value
   * Requirement 8.1: Temperature must be within range -50°C to 60°C
   * Requirement 11.1: Return null for missing or invalid values
   * 
   * @param temp - Temperature value to validate
   * @returns Validated temperature or null if missing/invalid
   */
  validateTemperature(temp: any): number | null {
    // Return null for missing values
    if (temp === null || temp === undefined) {
      return null;
    }

    // Return null for empty strings (Number('') returns 0)
    if (temp === '') {
      return null;
    }

    // Return null for arrays (Number([]) returns 0)
    if (Array.isArray(temp)) {
      return null;
    }

    // Return null for objects (except primitives)
    if (typeof temp === 'object') {
      return null;
    }

    // Convert to number
    let numTemp: number;
    try {
      numTemp = Number(temp);
    } catch (error) {
      return null;
    }

    // Return null for non-numeric values
    if (isNaN(numTemp)) {
      return null;
    }

    // Return null for values outside valid range (-50°C to 60°C)
    if (numTemp < -50 || numTemp > 60) {
      return null;
    }

    return numTemp;
  }

  /**
   * Validate relative humidity value
   * Requirement 8.2: Humidity must be within range 0% to 100%
   * Requirement 11.2: Return null for missing or invalid values
   * 
   * @param humidity - Humidity value to validate
   * @returns Validated humidity or null if missing/invalid
   */
  validateHumidity(humidity: any): number | null {
    // Return null for missing values
    if (humidity === null || humidity === undefined) {
      return null;
    }

    // Return null for empty strings (Number('') returns 0)
    if (humidity === '') {
      return null;
    }

    // Return null for arrays (Number([]) returns 0)
    if (Array.isArray(humidity)) {
      return null;
    }

    // Return null for objects (except primitives)
    if (typeof humidity === 'object') {
      return null;
    }

    // Convert to number
    let numHumidity: number;
    try {
      numHumidity = Number(humidity);
    } catch (error) {
      return null;
    }

    // Return null for non-numeric values
    if (isNaN(numHumidity)) {
      return null;
    }

    // Return null for values outside valid range (0% to 100%)
    if (numHumidity < 0 || numHumidity > 100) {
      return null;
    }

    return numHumidity;
  }

  /**
   * Validate wind speed value
   * Requirement 8.3: Wind speed must be non-negative
   * Requirement 11.1/11.2: Return null for missing or invalid values
   * 
   * @param windSpeed - Wind speed value to validate
   * @returns Validated wind speed or null if missing/invalid
   */
  validateWindSpeed(windSpeed: any): number | null {
    // Return null for missing values
    if (windSpeed === null || windSpeed === undefined) {
      return null;
    }

    // Return null for empty strings (Number('') returns 0)
    if (windSpeed === '') {
      return null;
    }

    // Return null for arrays (Number([]) returns 0)
    if (Array.isArray(windSpeed)) {
      return null;
    }

    // Return null for objects (except primitives)
    if (typeof windSpeed === 'object') {
      return null;
    }

    // Convert to number
    let numWindSpeed: number;
    try {
      numWindSpeed = Number(windSpeed);
    } catch (error) {
      return null;
    }

    // Return null for non-numeric values
    if (isNaN(numWindSpeed)) {
      return null;
    }

    // Return null for negative values
    if (numWindSpeed < 0) {
      return null;
    }

    return numWindSpeed;
  }

  /**
   * Validate dew point value (same range as temperature)
   * 
   * @param dewPoint - Dew point value to validate
   * @returns Validated dew point or null if missing/invalid
   */
  validateDewPoint(dewPoint: any): number | null {
    // Use same validation as temperature
    return this.validateTemperature(dewPoint);
  }

  /**
   * Calculate data quality based on number of null values
   * 
   * @param validatedData - Validated weather data
   * @returns Data quality level
   */
  private calculateDataQuality(validatedData: ValidatedWeatherData): DataQuality {
    const criticalFields = [
      validatedData.temperature,
      validatedData.relativeHumidity,
      validatedData.windSpeed
    ];

    const nullCount = criticalFields.filter(field => field === null).length;

    if (nullCount === 0) {
      return DataQuality.COMPLETE;
    } else if (nullCount <= 1) {
      return DataQuality.PARTIAL;
    } else {
      return DataQuality.INSUFFICIENT;
    }
  }

  /**
   * Validate complete weather data object
   * Requirement 12.2: Validate timezone information in all timestamps
   * 
   * @param data - Raw weather data from external API
   * @returns Validated weather data with null for invalid values
   */
  validate(data: RawWeatherData): ValidatedWeatherData {
    // Validate timezone first
    const timezoneValidation = validateTimezone(data.timezone);
    const validatedTimezone = timezoneValidation.isValid ? timezoneValidation.timezone! : 'UTC';

    // Validate timestamp with timezone
    const timestamp = new Date(data.timestamp);
    if (!validateTimestampWithTimezone(timestamp, validatedTimezone)) {
      throw new Error('Invalid timestamp or timezone combination');
    }

    const validated: ValidatedWeatherData = {
      temperature: this.validateTemperature(data.temperature),
      relativeHumidity: this.validateHumidity(data.relativeHumidity),
      windSpeed: this.validateWindSpeed(data.windSpeed),
      dewPoint: this.validateDewPoint(data.dewPoint),
      timestamp,
      timezone: validatedTimezone,
      dataQuality: DataQuality.COMPLETE // Will be recalculated below
    };

    // Calculate data quality based on null values
    validated.dataQuality = this.calculateDataQuality(validated);

    return validated;
  }

  /**
   * Assess data availability and determine if risk calculation is possible
   * Requirements 11.4, 11.5, 11.6: Communicate missing data to users
   * 
   * @param data - Validated weather data
   * @returns Data availability assessment
   */
  handleMissingData(data: ValidatedWeatherData): DataAvailability {
    const hasTemperature = data.temperature !== null;
    const hasHumidity = data.relativeHumidity !== null;
    const hasWindSpeed = data.windSpeed !== null;

    const missingFields: string[] = [];
    if (!hasTemperature) missingFields.push('temperature');
    if (!hasHumidity) missingFields.push('humidity');
    if (!hasWindSpeed) missingFields.push('wind speed');

    // Risk calculation requires at least temperature and humidity
    const canCalculateRisk = hasTemperature && hasHumidity;

    return {
      hasTemperature,
      hasHumidity,
      hasWindSpeed,
      canCalculateRisk,
      missingFields
    };
  }

  /**
   * Generate user-facing messages for missing weather data
   * Requirements 11.4, 11.5, 11.6: Notify users about missing data and impact on risk calculations
   * 
   * @param availability - Data availability assessment from handleMissingData
   * @returns Array of user-facing warning messages
   */
  generateMissingDataMessages(availability: DataAvailability): string[] {
    const messages: string[] = [];

    // Requirement 11.4 & 11.6: Notify user that some data is unavailable and which values are missing
    if (availability.missingFields.length > 0) {
      const fieldList = availability.missingFields.join(', ');
      messages.push(`Weather data unavailable: ${fieldList}. Some calculations may be affected.`);
    }

    // Requirement 11.5: Indicate that disease risk calculations may be incomplete
    if (!availability.canCalculateRisk) {
      if (!availability.hasTemperature && !availability.hasHumidity) {
        messages.push('Disease risk assessment unavailable without temperature and humidity data.');
      } else if (!availability.hasTemperature) {
        messages.push('Disease risk calculations may be incomplete without temperature data.');
      } else if (!availability.hasHumidity) {
        messages.push('Disease risk calculations may be incomplete without humidity data.');
      }
    }

    // Additional context for missing wind speed (doesn't prevent risk calculation but affects accuracy)
    if (!availability.hasWindSpeed && availability.canCalculateRisk) {
      messages.push('Leaf wetness calculations will use default wind conditions (wind speed data unavailable).');
    }

    return messages;
  }
}

/**
 * Default export for convenience
 */
export default WeatherValidator;
