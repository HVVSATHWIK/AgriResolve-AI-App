/**
 * OfflineDetector - Detects network connectivity and communicates feature availability
 * Feature: agricultural-accuracy-and-security-fixes
 * Requirements: 14.1, 14.4
 */

export interface OfflineDetector {
  isOnline(): boolean;
  onStatusChange(callback: (online: boolean) => void): () => void;
  checkAPIAvailability(): Promise<boolean>;
  checkGeminiAPIAvailability(): Promise<boolean>;
  checkWeatherAPIAvailability(): Promise<boolean>;
}

export class OfflineDetectorImpl implements OfflineDetector {
  private online: boolean;
  private listeners: ((online: boolean) => void)[] = [];
  private handleOnline: () => void;
  private handleOffline: () => void;

  constructor() {
    // Initialize with current online status
    this.online = typeof navigator !== 'undefined' ? navigator.onLine : true;

    // Bind event handlers
    this.handleOnline = () => this.updateStatus(true);
    this.handleOffline = () => this.updateStatus(false);

    // Add event listeners if in browser environment
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  /**
   * Check if the browser reports being online
   * Requirements: 14.1, 14.4
   */
  isOnline(): boolean {
    return this.online;
  }

  /**
   * Register a callback to be notified of status changes
   * Returns an unsubscribe function
   * Requirements: 14.1, 14.3
   */
  onStatusChange(callback: (online: boolean) => void): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Check if the backend API is actually reachable
   * This goes beyond navigator.onLine to verify actual connectivity
   * Requirements: 14.4
   */
  async checkAPIAvailability(): Promise<boolean> {
    // If browser reports offline, don't even try
    if (!this.online) {
      return false;
    }

    try {
      // Try to reach the health endpoint with a short timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/health', {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (_error) {
      // Network error, timeout, or abort
      return false;
    }
  }

  /**
   * Check if Gemini API is available through the backend
   * Requirement 16.1: Check Gemini API availability for graceful degradation
   */
  async checkGeminiAPIAvailability(): Promise<boolean> {
    // If browser reports offline, don't even try
    if (!this.online) {
      return false;
    }

    try {
      // Try to reach the Gemini health endpoint with a short timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/health/gemini', {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        return data.available === true;
      }
      
      return false;
    } catch (_error) {
      // Network error, timeout, or abort
      return false;
    }
  }

  /**
   * Check if Weather API is available through the backend
   * Requirement 16.2: Check Weather API availability for graceful degradation
   */
  async checkWeatherAPIAvailability(): Promise<boolean> {
    // If browser reports offline, don't even try
    if (!this.online) {
      return false;
    }

    try {
      // Try to reach the Weather health endpoint with a short timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/health/weather', {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        return data.available === true;
      }
      
      return false;
    } catch (_error) {
      // Network error, timeout, or abort
      return false;
    }
  }

  /**
   * Update the online status and notify all listeners
   * @private
   */
  private updateStatus(online: boolean): void {
    this.online = online;
    this.listeners.forEach((callback) => {
      try {
        callback(online);
      } catch (error) {
        console.error('Error in offline detector listener:', error);
      }
    });
  }

  /**
   * Clean up event listeners
   * Should be called when the detector is no longer needed
   */
  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    this.listeners = [];
  }
}

// Export a singleton instance for convenience
let instance: OfflineDetectorImpl | null = null;

export function getOfflineDetector(): OfflineDetector {
  if (!instance) {
    instance = new OfflineDetectorImpl();
  }
  return instance;
}

// For testing: allow resetting the singleton
export function resetOfflineDetector(): void {
  if (instance) {
    instance.destroy();
    instance = null;
  }
}
