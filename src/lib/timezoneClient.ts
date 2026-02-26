/**
 * Client-side Timezone Utilities
 * 
 * Handles timezone detection and communication with backend
 * Requirements: 12.3, 12.5
 */

/**
 * User timezone information
 */
export interface UserTimezoneInfo {
  timezone: string;
  offset: number;
  detectionMethod: 'browser' | 'geolocation' | 'manual' | 'default';
}

/**
 * Detect user's timezone from browser
 * Requirement 12.3: Implement user timezone detection
 * 
 * @returns User timezone information
 */
export function detectBrowserTimezone(): UserTimezoneInfo {
  try {
    // Get timezone from Intl API
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    if (timezone) {
      // Calculate current offset in minutes
      const now = new Date();
      const offset = -now.getTimezoneOffset();
      
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
 * Send detected timezone to backend
 * Requirement 12.3: Implement user timezone storage
 * 
 * @param timezone - Detected timezone string
 * @returns Promise resolving to success status
 */
export async function sendTimezoneToBackend(timezone: string): Promise<boolean> {
  try {
    const response = await fetch('/api/timezone/detect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // Include session cookie
      body: JSON.stringify({ timezone })
    });

    if (!response.ok) {
      console.warn('Failed to send timezone to backend:', response.statusText);
      return false;
    }

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Error sending timezone to backend:', error);
    return false;
  }
}

/**
 * Get user timezone from backend
 * 
 * @returns Promise resolving to user timezone info or null
 */
export async function getUserTimezoneFromBackend(): Promise<UserTimezoneInfo | null> {
  try {
    const response = await fetch('/api/timezone', {
      method: 'GET',
      credentials: 'include' // Include session cookie
    });

    if (!response.ok) {
      console.warn('Failed to get timezone from backend:', response.statusText);
      return null;
    }

    const data = await response.json();
    if (data.success && data.timezone) {
      return {
        timezone: data.timezone,
        offset: data.offset,
        detectionMethod: data.detectionMethod
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting timezone from backend:', error);
    return null;
  }
}

/**
 * Set user timezone manually
 * 
 * @param timezone - Timezone string to set
 * @returns Promise resolving to success status
 */
export async function setUserTimezone(timezone: string): Promise<boolean> {
  try {
    const response = await fetch('/api/timezone', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        timezone,
        detectionMethod: 'manual'
      })
    });

    if (!response.ok) {
      console.warn('Failed to set timezone:', response.statusText);
      return false;
    }

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Error setting timezone:', error);
    return false;
  }
}

/**
 * Initialize timezone detection and send to backend
 * Should be called once when the app loads
 * Requirement 12.3: Implement user timezone detection and storage
 */
export async function initializeTimezone(): Promise<void> {
  try {
    // First, check if backend already has a timezone
    const existingTimezone = await getUserTimezoneFromBackend();
    
    if (existingTimezone && existingTimezone.detectionMethod !== 'default') {
      console.log('Using existing timezone from backend:', existingTimezone.timezone);
      return;
    }

    // Detect timezone from browser
    const detected = detectBrowserTimezone();
    console.log('Detected timezone:', detected.timezone);

    // Send to backend
    const success = await sendTimezoneToBackend(detected.timezone);
    
    if (success) {
      console.log('Timezone sent to backend successfully');
    } else {
      console.warn('Failed to send timezone to backend');
    }
  } catch (error) {
    console.error('Error initializing timezone:', error);
  }
}

/**
 * Format timestamp in user's local timezone
 * Requirement 12.5: Display times in user's local timezone
 * 
 * @param timestamp - Date or ISO string to format
 * @param timezone - Optional timezone (defaults to browser timezone)
 * @returns Formatted timestamp string
 */
export function formatTimestampInTimezone(
  timestamp: Date | string,
  timezone?: string
): string {
  try {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    return date.toLocaleString('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return timestamp.toString();
  }
}

/**
 * Get timezone offset string (e.g., "UTC+5:30")
 * 
 * @param timezone - Timezone string
 * @returns Formatted offset string
 */
export function getTimezoneOffsetString(timezone?: string): string {
  try {
    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();
    
    // Get offset in minutes
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'shortOffset'
    });
    
    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find(part => part.type === 'timeZoneName');
    
    if (offsetPart) {
      return offsetPart.value;
    }

    // Fallback: calculate offset manually
    const offset = -now.getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const absOffset = Math.abs(offset);
    const hours = Math.floor(absOffset / 60);
    const minutes = absOffset % 60;
    
    return `UTC${sign}${hours}${minutes > 0 ? ':' + minutes.toString().padStart(2, '0') : ''}`;
  } catch (error) {
    console.error('Error getting timezone offset:', error);
    return 'UTC';
  }
}
