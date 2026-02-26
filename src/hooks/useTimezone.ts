/**
 * React Hook for Timezone Management
 * 
 * Provides timezone detection, storage, and formatting utilities
 * Requirements: 12.3, 12.5
 */

import { useState, useEffect } from 'react';
import {
  detectBrowserTimezone,
  initializeTimezone,
  getUserTimezoneFromBackend,
  setUserTimezone as setUserTimezoneAPI,
  formatTimestampInTimezone,
  getTimezoneOffsetString,
  UserTimezoneInfo
} from '../lib/timezoneClient';

/**
 * Hook for managing user timezone
 * 
 * @returns Timezone information and management functions
 */
export function useTimezone() {
  const [timezone, setTimezone] = useState<UserTimezoneInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize timezone on mount
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Try to get timezone from backend first
        const backendTimezone = await getUserTimezoneFromBackend();
        
        if (backendTimezone) {
          setTimezone(backendTimezone);
        } else {
          // Detect from browser and send to backend
          const detected = detectBrowserTimezone();
          setTimezone(detected);
          
          // Initialize in background (send to backend)
          initializeTimezone().catch(err => {
            console.warn('Failed to initialize timezone on backend:', err);
          });
        }
      } catch (err) {
        console.error('Error initializing timezone:', err);
        setError('Failed to detect timezone');
        
        // Fallback to browser detection
        const detected = detectBrowserTimezone();
        setTimezone(detected);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  /**
   * Update user timezone
   */
  const updateTimezone = async (newTimezone: string): Promise<boolean> => {
    try {
      setError(null);
      const success = await setUserTimezoneAPI(newTimezone);
      
      if (success) {
        // Update local state
        const now = new Date();
        const offset = -now.getTimezoneOffset();
        
        setTimezone({
          timezone: newTimezone,
          offset,
          detectionMethod: 'manual'
        });
        
        return true;
      }
      
      setError('Failed to update timezone');
      return false;
    } catch (err) {
      console.error('Error updating timezone:', err);
      setError('Failed to update timezone');
      return false;
    }
  };

  /**
   * Format a timestamp in the user's timezone
   */
  const formatTimestamp = (timestamp: Date | string): string => {
    if (!timezone) {
      return timestamp.toString();
    }
    
    return formatTimestampInTimezone(timestamp, timezone.timezone);
  };

  /**
   * Get timezone offset string
   */
  const getOffsetString = (): string => {
    if (!timezone) {
      return 'UTC';
    }
    
    return getTimezoneOffsetString(timezone.timezone);
  };

  return {
    timezone: timezone?.timezone || 'UTC',
    offset: timezone?.offset || 0,
    detectionMethod: timezone?.detectionMethod || 'default',
    isLoading,
    error,
    updateTimezone,
    formatTimestamp,
    getOffsetString
  };
}

/**
 * Hook for formatting timestamps in user's timezone
 * Simpler version that just provides formatting without state management
 * 
 * @returns Formatting function
 */
export function useTimestampFormatter() {
  const { formatTimestamp } = useTimezone();
  return formatTimestamp;
}
