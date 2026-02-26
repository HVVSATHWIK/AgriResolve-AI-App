/**
 * Leaf Wetness Calculation Integration Tests
 * 
 * Tests the enhanced leaf wetness calculation with both single-point and hourly data.
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import { DiseaseRiskModel } from '../diseaseRiskModel.js';
import { ValidatedWeatherData, DataQuality } from '../../utils/weatherValidator.js';

describe('Leaf Wetness Calculation - Integration Tests', () => {
  let model: DiseaseRiskModel;

  beforeEach(() => {
    model = new DiseaseRiskModel();
  });

  describe('Single-point weather data', () => {
    it('should calculate wetness for single data point', () => {
      const weatherData: ValidatedWeatherData = {
        temperature: 20,
        relativeHumidity: 95,
        windSpeed: 2,
        dewPoint: 19,
        timestamp: new Date('2024-01-15T12:00:00Z'),
        timezone: 'UTC',
        dataQuality: DataQuality.COMPLETE
      };

      const wetness = model.calculateLeafWetness(weatherData, 'UTC');

      // Should return a positive value
      expect(wetness).toBeGreaterThan(0);
      expect(typeof wetness).toBe('number');
      expect(Number.isFinite(wetness)).toBe(true);
    });

    it('should handle high humidity (>90%) correctly', () => {
      const weatherData: ValidatedWeatherData = {
        temperature: 20,
        relativeHumidity: 92, // Above 90% threshold
        windSpeed: 2,
        dewPoint: 18,
        timestamp: new Date('2024-01-15T12:00:00Z'),
        timezone: 'UTC',
        dataQuality: DataQuality.COMPLETE
      };

      const wetness = model.calculateLeafWetness(weatherData, 'UTC');

      // High humidity should result in significant wetness
      expect(wetness).toBeGreaterThan(5);
    });

    it('should apply wind speed reduction (>3 m/s)', () => {
      const lowWind: ValidatedWeatherData = {
        temperature: 20,
        relativeHumidity: 92,
        windSpeed: 2, // Below threshold
        dewPoint: 18,
        timestamp: new Date('2024-01-15T12:00:00Z'),
        timezone: 'UTC',
        dataQuality: DataQuality.COMPLETE
      };

      const highWind: ValidatedWeatherData = {
        ...lowWind,
        windSpeed: 5 // Above 3 m/s threshold
      };

      const wetnessLowWind = model.calculateLeafWetness(lowWind, 'UTC');
      const wetnessHighWind = model.calculateLeafWetness(highWind, 'UTC');

      // High wind should reduce wetness by 20%
      expect(wetnessHighWind).toBeLessThan(wetnessLowWind);
      expect(wetnessHighWind).toBeCloseTo(wetnessLowWind * 0.8, 1);
    });

    it('should detect dew point condensation', () => {
      const condensation: ValidatedWeatherData = {
        temperature: 20,
        relativeHumidity: 85,
        windSpeed: 2,
        dewPoint: 20, // Equals temperature
        timestamp: new Date('2024-01-15T12:00:00Z'),
        timezone: 'UTC',
        dataQuality: DataQuality.COMPLETE
      };

      const noCondensation: ValidatedWeatherData = {
        ...condensation,
        dewPoint: 15 // Below temperature
      };

      const wetnessWithCondensation = model.calculateLeafWetness(condensation, 'UTC');
      const wetnessWithoutCondensation = model.calculateLeafWetness(noCondensation, 'UTC');

      // Condensation should increase wetness
      expect(wetnessWithCondensation).toBeGreaterThan(wetnessWithoutCondensation);
    });
  });

  describe('Hourly weather data', () => {
    it('should calculate wetness from hourly data array', () => {
      // Create 24 hours of weather data
      const hourlyData: ValidatedWeatherData[] = [];
      const baseTime = new Date('2024-01-15T00:00:00Z');

      for (let i = 0; i < 24; i++) {
        hourlyData.push({
          temperature: 20,
          relativeHumidity: 85,
          windSpeed: 2,
          dewPoint: 18,
          timestamp: new Date(baseTime.getTime() + i * 60 * 60 * 1000),
          timezone: 'UTC',
          dataQuality: DataQuality.COMPLETE
        });
      }

      const wetness = model.calculateLeafWetness(hourlyData, 'UTC');

      // Should return a positive value
      expect(wetness).toBeGreaterThan(0);
      expect(typeof wetness).toBe('number');
      expect(Number.isFinite(wetness)).toBe(true);
    });

    it('should apply daylight evaporation to hourly data', () => {
      // Create hourly data with high humidity
      const hourlyData: ValidatedWeatherData[] = [];
      const baseTime = new Date('2024-01-15T00:00:00Z');

      for (let i = 0; i < 24; i++) {
        hourlyData.push({
          temperature: 20,
          relativeHumidity: 92, // High but < 95%
          windSpeed: 2,
          dewPoint: 19,
          timestamp: new Date(baseTime.getTime() + i * 60 * 60 * 1000),
          timezone: 'UTC',
          dataQuality: DataQuality.COMPLETE
        });
      }

      const wetness = model.calculateLeafWetness(hourlyData, 'UTC');

      // Daylight hours (6 AM - 6 PM) should have reduced wetness
      // With 24 hours of data, some hours will be daylight
      expect(wetness).toBeGreaterThan(0);
      expect(wetness).toBeLessThan(24); // Not all hours are fully wet due to evaporation
    });

    it('should handle mixed conditions in hourly data', () => {
      const hourlyData: ValidatedWeatherData[] = [];
      const baseTime = new Date('2024-01-15T00:00:00Z');

      // First 12 hours: high humidity, low wind
      for (let i = 0; i < 12; i++) {
        hourlyData.push({
          temperature: 20,
          relativeHumidity: 95,
          windSpeed: 2,
          dewPoint: 19,
          timestamp: new Date(baseTime.getTime() + i * 60 * 60 * 1000),
          timezone: 'UTC',
          dataQuality: DataQuality.COMPLETE
        });
      }

      // Next 12 hours: lower humidity, high wind
      for (let i = 12; i < 24; i++) {
        hourlyData.push({
          temperature: 20,
          relativeHumidity: 70,
          windSpeed: 5,
          dewPoint: 15,
          timestamp: new Date(baseTime.getTime() + i * 60 * 60 * 1000),
          timezone: 'UTC',
          dataQuality: DataQuality.COMPLETE
        });
      }

      const wetness = model.calculateLeafWetness(hourlyData, 'UTC');

      // Should have more wetness from first 12 hours
      expect(wetness).toBeGreaterThan(0);
      expect(wetness).toBeLessThan(24); // Not all hours are fully wet
    });

    it('should handle empty hourly data array', () => {
      const hourlyData: ValidatedWeatherData[] = [];

      const wetness = model.calculateLeafWetness(hourlyData, 'UTC');

      // Empty array should return 0
      expect(wetness).toBe(0);
    });

    it('should accumulate wetness hours correctly', () => {
      // Create 3 hours of very wet conditions
      const hourlyData: ValidatedWeatherData[] = [];
      const baseTime = new Date('2024-01-15T00:00:00Z'); // Nighttime

      for (let i = 0; i < 3; i++) {
        hourlyData.push({
          temperature: 20,
          relativeHumidity: 95, // Very high
          windSpeed: 1, // Low wind
          dewPoint: 20, // Condensation
          timestamp: new Date(baseTime.getTime() + i * 60 * 60 * 1000),
          timezone: 'UTC',
          dataQuality: DataQuality.COMPLETE
        });
      }

      const wetness = model.calculateLeafWetness(hourlyData, 'UTC');

      // Should be close to 3 hours (nighttime, high humidity, condensation)
      expect(wetness).toBeGreaterThan(2);
      expect(wetness).toBeLessThanOrEqual(3);
    });
  });

  describe('Timezone-aware calculations', () => {
    it('should use timezone for daylight detection', () => {
      const noonUTC: ValidatedWeatherData = {
        temperature: 20,
        relativeHumidity: 92,
        windSpeed: 2,
        dewPoint: 18,
        timestamp: new Date('2024-01-15T12:00:00Z'), // Noon UTC
        timezone: 'UTC',
        dataQuality: DataQuality.COMPLETE
      };

      const wetness = model.calculateLeafWetness(noonUTC, 'UTC');

      // Noon should be daylight, so evaporation should apply
      expect(wetness).toBeGreaterThan(0);
    });

    it('should handle different timezones', () => {
      const weatherData: ValidatedWeatherData = {
        temperature: 20,
        relativeHumidity: 92,
        windSpeed: 2,
        dewPoint: 18,
        timestamp: new Date('2024-01-15T12:00:00Z'),
        timezone: 'America/New_York',
        dataQuality: DataQuality.COMPLETE
      };

      const wetness = model.calculateLeafWetness(weatherData, 'America/New_York');

      // Should calculate correctly with different timezone
      expect(wetness).toBeGreaterThan(0);
      expect(typeof wetness).toBe('number');
    });
  });

  describe('Edge cases', () => {
    it('should handle null weather values gracefully', () => {
      const weatherData: ValidatedWeatherData = {
        temperature: null,
        relativeHumidity: null,
        windSpeed: null,
        dewPoint: null,
        timestamp: new Date('2024-01-15T12:00:00Z'),
        timezone: 'UTC',
        dataQuality: DataQuality.INSUFFICIENT
      };

      const wetness = model.calculateLeafWetness(weatherData, 'UTC');

      // Should return a non-negative value even with null data
      expect(wetness).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(wetness)).toBe(true);
    });

    it('should never return negative wetness', () => {
      const weatherData: ValidatedWeatherData = {
        temperature: 30,
        relativeHumidity: 20, // Very low
        windSpeed: 10, // Very high
        dewPoint: 5, // Very low
        timestamp: new Date('2024-01-15T12:00:00Z'), // Daylight
        timezone: 'UTC',
        dataQuality: DataQuality.COMPLETE
      };

      const wetness = model.calculateLeafWetness(weatherData, 'UTC');

      // Even in very dry, windy conditions, wetness should not be negative
      expect(wetness).toBeGreaterThanOrEqual(0);
    });

    it('should handle extreme humidity (100%)', () => {
      const weatherData: ValidatedWeatherData = {
        temperature: 20,
        relativeHumidity: 100,
        windSpeed: 2,
        dewPoint: 20,
        timestamp: new Date('2024-01-15T12:00:00Z'),
        timezone: 'UTC',
        dataQuality: DataQuality.COMPLETE
      };

      const wetness = model.calculateLeafWetness(weatherData, 'UTC');

      // 100% humidity should result in high wetness
      expect(wetness).toBeGreaterThan(5);
    });
  });
});
