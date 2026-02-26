/**
 * Service Status Tracker
 * 
 * Tracks the availability status of external services (Gemini API, Weather API)
 * and provides state management for graceful degradation
 * 
 * Feature: agricultural-accuracy-and-security-fixes
 * Requirements: 16.1, 16.2
 */

import { getOfflineDetector } from './OfflineDetector';

export interface ServiceStatus {
  available: boolean;
  lastChecked: Date | null;
  message: string;
}

export interface ServicesState {
  gemini: ServiceStatus;
  weather: ServiceStatus;
  overall: boolean;
}

export type ServiceStatusListener = (state: ServicesState) => void;

/**
 * Service Status Tracker
 * 
 * Monitors the availability of external services and notifies listeners of changes
 */
export class ServiceStatusTracker {
  private state: ServicesState;
  private listeners: ServiceStatusListener[] = [];
  private checkInterval: NodeJS.Timeout | null = null;
  private offlineDetector = getOfflineDetector();

  constructor() {
    this.state = {
      gemini: {
        available: true,
        lastChecked: null,
        message: 'Not checked yet'
      },
      weather: {
        available: true,
        lastChecked: null,
        message: 'Not checked yet'
      },
      overall: true
    };
  }

  /**
   * Get current service status state
   */
  getState(): ServicesState {
    return { ...this.state };
  }

  /**
   * Subscribe to service status changes
   * Returns an unsubscribe function
   */
  subscribe(listener: ServiceStatusListener): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Check all service availability
   * Requirement 16.1, 16.2: Check service availability for graceful degradation
   */
  async checkAllServices(): Promise<ServicesState> {
    const [geminiAvailable, weatherAvailable] = await Promise.all([
      this.offlineDetector.checkGeminiAPIAvailability(),
      this.offlineDetector.checkWeatherAPIAvailability()
    ]);

    const now = new Date();

    this.state = {
      gemini: {
        available: geminiAvailable,
        lastChecked: now,
        message: geminiAvailable 
          ? 'Gemini API is operational' 
          : 'Gemini API is unavailable'
      },
      weather: {
        available: weatherAvailable,
        lastChecked: now,
        message: weatherAvailable 
          ? 'Weather API is operational' 
          : 'Weather API is unavailable'
      },
      overall: geminiAvailable && weatherAvailable
    };

    // Notify all listeners
    this.notifyListeners();

    return this.getState();
  }

  /**
   * Check specific service availability
   */
  async checkService(service: 'gemini' | 'weather'): Promise<ServiceStatus> {
    const now = new Date();
    let available = false;

    if (service === 'gemini') {
      available = await this.offlineDetector.checkGeminiAPIAvailability();
      this.state.gemini = {
        available,
        lastChecked: now,
        message: available 
          ? 'Gemini API is operational' 
          : 'Gemini API is unavailable'
      };
    } else {
      available = await this.offlineDetector.checkWeatherAPIAvailability();
      this.state.weather = {
        available,
        lastChecked: now,
        message: available 
          ? 'Weather API is operational' 
          : 'Weather API is unavailable'
      };
    }

    // Update overall status
    this.state.overall = this.state.gemini.available && this.state.weather.available;

    // Notify all listeners
    this.notifyListeners();

    return service === 'gemini' ? this.state.gemini : this.state.weather;
  }

  /**
   * Start periodic service health checks
   * @param intervalMs - Check interval in milliseconds (default: 60000 = 1 minute)
   */
  startPeriodicChecks(intervalMs: number = 60000): void {
    // Stop any existing interval
    this.stopPeriodicChecks();

    // Perform initial check
    this.checkAllServices();

    // Set up periodic checks
    this.checkInterval = setInterval(() => {
      this.checkAllServices();
    }, intervalMs);
  }

  /**
   * Stop periodic service health checks
   */
  stopPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Notify all listeners of state changes
   * @private
   */
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in service status listener:', error);
      }
    });
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopPeriodicChecks();
    this.listeners = [];
  }
}

// Export a singleton instance for convenience
let instance: ServiceStatusTracker | null = null;

export function getServiceStatusTracker(): ServiceStatusTracker {
  if (!instance) {
    instance = new ServiceStatusTracker();
  }
  return instance;
}

// For testing: allow resetting the singleton
export function resetServiceStatusTracker(): void {
  if (instance) {
    instance.destroy();
    instance = null;
  }
}
