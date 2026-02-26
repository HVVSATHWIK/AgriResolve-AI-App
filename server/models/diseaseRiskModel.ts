/**
 * Disease Risk Model
 * 
 * Calculates crop-specific and disease-specific risk scores using weather data and leaf wetness duration.
 * Requirements: 1.1, 1.2, 1.6, 1.7
 */

import {
  CropType,
  DiseaseName,
  DISEASE_THRESHOLDS,
  getDiseasesForCrop,
  getDiseaseThreshold,
  getHumanReadableDiseaseName
} from './diseaseThresholds.js';
import { ValidatedWeatherData, DataQuality } from '../utils/weatherValidator.js';
import { isDaylightHour } from '../utils/timezoneUtils.js';

/**
 * Risk level categories
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Risk factor contribution to overall disease risk
 */
export interface RiskFactor {
  name: string;
  value: number | null;
  contribution: number; // percentage contribution to risk (0-100)
}

/**
 * Individual disease risk assessment
 */
export interface DiseaseRisk {
  diseaseName: string;
  diseaseDisplayName: string;
  riskLevel: RiskLevel;
  riskScore: number; // 0-100
  factors: RiskFactor[];
}

/**
 * Confidence score components
 */
export interface ConfidenceScore {
  overall: number; // 0-100
  components: {
    weatherData: number;
    modelAccuracy: number;
  };
}

/**
 * Parameters for risk calculation
 */
export interface RiskCalculationParams {
  cropType: CropType;
  weatherData: ValidatedWeatherData;
  leafWetnessHours: number;
}

/**
 * Result of disease risk calculation
 */
export interface DiseaseRiskResult {
  risks: DiseaseRisk[];
  confidence: ConfidenceScore;
  warnings: string[];
}

/**
 * DiseaseRiskModel class
 * 
 * Implements disease-specific risk assessment with crop filtering and threshold application.
 */
export class DiseaseRiskModel {
  /**
   * Calculate disease risks for a specific crop based on weather conditions
   * 
   * Requirements:
   * - 1.1: Use crop-specific temperature thresholds for each disease type
   * - 1.2: Use disease-specific leaf wetness duration thresholds
   * - 1.6: Calculate separate risk scores for each applicable disease
   * - 1.7: Exclude diseases not relevant to the selected crop type
   * 
   * @param params - Risk calculation parameters
   * @returns Disease risk assessment results
   */
  calculateRisk(params: RiskCalculationParams): DiseaseRiskResult {
    const { cropType, weatherData, leafWetnessHours } = params;
    const warnings: string[] = [];

    // Requirement 1.7: Filter diseases by crop type relevance
    const relevantDiseases = getDiseasesForCrop(cropType);

    // Calculate risk for each relevant disease
    const risks: DiseaseRisk[] = [];

    for (const diseaseName of relevantDiseases) {
      const threshold = getDiseaseThreshold(diseaseName);
      if (!threshold) {
        continue; // Skip if threshold not found
      }

      // Requirement 1.6: Calculate separate risk scores for each disease
      const diseaseRisk = this.calculateDiseaseRisk(
        diseaseName,
        threshold,
        weatherData,
        leafWetnessHours
      );

      risks.push(diseaseRisk);
    }

    // Calculate confidence score
    const confidence = this.calculateConfidence(weatherData);

    // Add warnings for missing data
    if (weatherData.dataQuality !== DataQuality.COMPLETE) {
      warnings.push('Some weather data is missing. Risk calculations may be less accurate.');
    }

    if (weatherData.temperature === null || weatherData.relativeHumidity === null) {
      warnings.push('Critical weather data (temperature or humidity) is missing. Risk scores may be unreliable.');
    }

    return {
      risks,
      confidence,
      warnings
    };
  }

  /**
   * Calculate risk for a single disease
   * 
   * Requirements:
   * - 1.1: Apply crop-specific temperature thresholds
   * - 1.2: Apply disease-specific leaf wetness duration thresholds
   * 
   * @param diseaseName - Name of the disease
   * @param threshold - Disease threshold configuration
   * @param weatherData - Validated weather data
   * @param leafWetnessHours - Calculated leaf wetness duration
   * @returns Disease risk assessment
   */
  private calculateDiseaseRisk(
    diseaseName: DiseaseName,
    threshold: any,
    weatherData: ValidatedWeatherData,
    leafWetnessHours: number
  ): DiseaseRisk {
    const factors: RiskFactor[] = [];
    let totalRiskScore = 0;
    let factorCount = 0;

    // Temperature factor
    const tempFactor = this.calculateTemperatureFactor(
      weatherData.temperature,
      threshold.tempMin,
      threshold.tempMax,
      threshold.optimalTemp
    );
    factors.push({
      name: 'Temperature',
      value: weatherData.temperature,
      contribution: 0 // Will be calculated after all factors
    });

    // Humidity factor (high humidity increases risk)
    const humidityFactor = this.calculateHumidityFactor(weatherData.relativeHumidity);
    factors.push({
      name: 'Humidity',
      value: weatherData.relativeHumidity,
      contribution: 0
    });

    // Leaf wetness factor
    const wetnessFactor = this.calculateWetnessFactor(
      leafWetnessHours,
      threshold.minWetnessHours
    );
    factors.push({
      name: 'Leaf Wetness Duration',
      value: leafWetnessHours,
      contribution: 0
    });

    // Calculate weighted risk score
    // Temperature is most important (40%), wetness is critical (40%), humidity adds context (20%)
    const tempWeight = 0.4;
    const wetnessWeight = 0.4;
    const humidityWeight = 0.2;

    totalRiskScore = 
      (tempFactor * tempWeight) +
      (wetnessFactor * wetnessWeight) +
      (humidityFactor * humidityWeight);

    // Calculate contribution percentages
    // Handle edge case where totalRiskScore is 0 to avoid NaN
    let tempContribution: number;
    let wetnessContribution: number;
    let humidityContribution: number;

    if (totalRiskScore === 0) {
      // If total risk is 0, distribute contributions equally
      tempContribution = 33.33;
      wetnessContribution = 33.33;
      humidityContribution = 33.34;
    } else {
      tempContribution = (tempFactor * tempWeight / totalRiskScore) * 100;
      wetnessContribution = (wetnessFactor * wetnessWeight / totalRiskScore) * 100;
      humidityContribution = (humidityFactor * humidityWeight / totalRiskScore) * 100;
    }

    factors[0].contribution = Math.round(tempContribution);
    factors[1].contribution = Math.round(humidityContribution);
    factors[2].contribution = Math.round(wetnessContribution);

    // Normalize to 0-100 scale
    const riskScore = Math.round(totalRiskScore * 100);

    // Determine risk level
    const riskLevel = this.determineRiskLevel(riskScore);

    return {
      diseaseName,
      diseaseDisplayName: getHumanReadableDiseaseName(diseaseName),
      riskLevel,
      riskScore,
      factors
    };
  }

  /**
   * Calculate temperature factor (0-1 scale)
   * 
   * Requirement 1.1: Use crop-specific temperature thresholds for each disease type
   * 
   * @param temperature - Current temperature (°C) or null
   * @param tempMin - Minimum temperature for disease development
   * @param tempMax - Maximum temperature for disease development
   * @param optimalTemp - Optimal temperature for disease development
   * @returns Temperature risk factor (0-1)
   */
  private calculateTemperatureFactor(
    temperature: number | null,
    tempMin: number,
    tempMax: number,
    optimalTemp: number
  ): number {
    // If temperature is missing or NaN, return moderate risk (0.5)
    if (temperature === null || Number.isNaN(temperature)) {
      return 0.5;
    }

    // Outside range: no risk
    if (temperature < tempMin || temperature > tempMax) {
      return 0;
    }

    // Calculate distance from optimal temperature
    // Risk is highest at optimal temperature, decreases toward min/max
    const rangeSize = tempMax - tempMin;
    const distanceFromOptimal = Math.abs(temperature - optimalTemp);
    const maxDistance = Math.max(optimalTemp - tempMin, tempMax - optimalTemp);

    // Risk factor: 1.0 at optimal, decreases linearly to 0.3 at boundaries
    const factor = 1.0 - (distanceFromOptimal / maxDistance) * 0.7;

    return Math.max(0, Math.min(1, factor));
  }

  /**
   * Calculate humidity factor (0-1 scale)
   * 
   * High humidity increases disease risk
   * 
   * @param humidity - Relative humidity (%) or null
   * @returns Humidity risk factor (0-1)
   */
  private calculateHumidityFactor(humidity: number | null): number {
    // If humidity is missing or NaN, return moderate risk (0.5)
    if (humidity === null || Number.isNaN(humidity)) {
      return 0.5;
    }

    // Low humidity (<60%): low risk
    if (humidity < 60) {
      return 0.2;
    }

    // Medium humidity (60-80%): moderate risk
    if (humidity < 80) {
      return 0.5 + ((humidity - 60) / 20) * 0.3; // 0.5 to 0.8
    }

    // High humidity (80-100%): high risk
    return 0.8 + ((humidity - 80) / 20) * 0.2; // 0.8 to 1.0
  }

  /**
   * Calculate leaf wetness factor (0-1 scale)
   * 
   * Requirement 1.2: Use disease-specific leaf wetness duration thresholds
   * 
   * @param leafWetnessHours - Calculated leaf wetness duration (hours)
   * @param minWetnessHours - Minimum wetness hours required for infection
   * @returns Wetness risk factor (0-1)
   */
  private calculateWetnessFactor(
    leafWetnessHours: number,
    minWetnessHours: number
  ): number {
    // Handle NaN or negative values
    if (Number.isNaN(leafWetnessHours) || leafWetnessHours < 0) {
      return 0.1; // Very low risk for invalid data
    }

    // Handle diseases that don't require wetness (e.g., soil-borne diseases)
    if (minWetnessHours === 0) {
      return 0.5; // Moderate baseline risk for wetness-independent diseases
    }

    // Handle NaN or invalid minWetnessHours
    if (Number.isNaN(minWetnessHours) || minWetnessHours < 0) {
      return 0.5; // Moderate risk for invalid threshold data
    }

    // Below minimum: very low risk
    if (leafWetnessHours < minWetnessHours * 0.5) {
      return 0.1;
    }

    // Approaching minimum: increasing risk
    if (leafWetnessHours < minWetnessHours) {
      const ratio = leafWetnessHours / minWetnessHours;
      return 0.1 + (ratio * 0.4); // 0.1 to 0.5
    }

    // At or above minimum: high risk
    // Risk increases up to 2x the minimum threshold, then plateaus
    const excessRatio = Math.min(leafWetnessHours / minWetnessHours, 2.0);
    return 0.5 + ((excessRatio - 1.0) * 0.5); // 0.5 to 1.0
  }

  /**
   * Determine risk level category from risk score
   * 
   * @param riskScore - Risk score (0-100)
   * @returns Risk level category
   */
  private determineRiskLevel(riskScore: number): RiskLevel {
    if (riskScore < 25) {
      return 'low';
    } else if (riskScore < 50) {
      return 'medium';
    } else if (riskScore < 75) {
      return 'high';
    } else {
      return 'critical';
    }
  }

  /**
   * Calculate confidence score based on data quality
   * 
   * @param weatherData - Validated weather data
   * @returns Confidence score
   */
  private calculateConfidence(weatherData: ValidatedWeatherData): ConfidenceScore {
    // Weather data confidence based on completeness
    let weatherDataConfidence = 100;

    if (weatherData.temperature === null) {
      weatherDataConfidence -= 40; // Temperature is critical
    }
    if (weatherData.relativeHumidity === null) {
      weatherDataConfidence -= 40; // Humidity is critical
    }
    if (weatherData.windSpeed === null) {
      weatherDataConfidence -= 10; // Wind speed is less critical
    }
    if (weatherData.dewPoint === null) {
      weatherDataConfidence -= 10; // Dew point is less critical
    }

    // Model accuracy is a fixed value (could be improved with validation data)
    const modelAccuracy = 75; // Conservative estimate

    // Overall confidence is weighted average
    const overall = Math.round((weatherDataConfidence * 0.6) + (modelAccuracy * 0.4));

    return {
      overall,
      components: {
        weatherData: weatherDataConfidence,
        modelAccuracy
      }
    };
  }

  /**
   * Calculate leaf wetness duration based on weather conditions
   * 
   * Requirements:
   * - 2.1: Incorporate solar radiation proxy based on time of day
   * - 2.2: Apply wind speed effects on drying rate
   * - 2.3: Reduce wetness duration by 20% when wind speed > 3 m/s
   * - 2.4: Apply increased evaporation rate during daylight hours
   * - 2.5: Assume leaf surfaces remain wet when RH > 90%
   * - 2.6: Count hours as wet when dew point >= air temperature
   * 
   * @param weatherData - Validated weather data (single point or array of hourly readings)
   * @param timezone - Timezone for daylight calculations
   * @param latitude - Optional latitude for more accurate daylight calculations
   * @returns Leaf wetness duration in hours
   */
  calculateLeafWetness(
    weatherData: ValidatedWeatherData | ValidatedWeatherData[],
    timezone: string,
    latitude?: number
  ): number {
    // Handle both single data point and hourly array
    const hourlyData = Array.isArray(weatherData) ? weatherData : [weatherData];
    
    let totalWetnessHours = 0;

    // Process each hour of weather data
    for (const hourData of hourlyData) {
      let hourWetness = 0;

      // Requirement 2.5: High humidity (>90%) indicates wet leaves
      const highHumidity = hourData.relativeHumidity !== null && hourData.relativeHumidity > 90;
      
      // Requirement 2.6: Dew point >= temperature indicates condensation (wet leaves)
      const dewPointCondensation = 
        hourData.temperature !== null && 
        hourData.dewPoint !== null && 
        hourData.dewPoint >= hourData.temperature;

      // Base wetness determination for this hour
      if (highHumidity || dewPointCondensation) {
        // Requirement 2.5 & 2.6: Assume leaf surfaces remain wet
        hourWetness = 1.0; // Full hour of wetness
      } else if (hourData.relativeHumidity !== null && hourData.relativeHumidity > 80) {
        // Moderate humidity - partial wetness likely
        hourWetness = 0.5;
      } else {
        // Low humidity - minimal wetness
        hourWetness = 0.1;
      }

      // Requirement 2.2 & 2.3: Wind speed reduction factor (>3 m/s reduces by 20%)
      if (hourData.windSpeed !== null && hourData.windSpeed > 3) {
        hourWetness *= 0.8; // 20% reduction
      }

      // Requirement 2.1 & 2.4: Solar radiation proxy using time of day
      // During daylight hours, evaporation increases, reducing wetness
      const daylightInfo = isDaylightHour(hourData.timestamp, timezone, latitude);
      
      if (daylightInfo.isDaylight && hourData.relativeHumidity !== null && hourData.relativeHumidity < 95) {
        // Requirement 2.4: Apply increased evaporation rate during daylight
        // Only apply if humidity is not extremely high (< 95%)
        hourWetness *= 0.7; // 30% reduction due to solar evaporation
      }

      // Accumulate wetness hours
      totalWetnessHours += hourWetness;
    }

    // If single data point was provided, estimate for 24-hour period
    if (!Array.isArray(weatherData)) {
      // Scale the single-hour calculation to a daily estimate
      // This is a rough approximation when hourly data is not available
      totalWetnessHours *= 12; // Assume similar conditions for ~12 hours
    }

    // Ensure non-negative result
    totalWetnessHours = Math.max(0, totalWetnessHours);

    return totalWetnessHours;
  }
}

/**
 * Default export for convenience
 */
export default DiseaseRiskModel;
