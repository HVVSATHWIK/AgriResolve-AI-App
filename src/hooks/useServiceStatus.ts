/**
 * useServiceStatus Hook
 * 
 * React hook for tracking service availability status
 * 
 * Feature: agricultural-accuracy-and-security-fixes
 * Requirements: 16.1, 16.2
 */

import { useState, useEffect } from 'react';
import { getServiceStatusTracker, ServicesState } from '../services/ServiceStatusTracker';

/**
 * Hook to track service availability status
 * 
 * @param autoCheck - Whether to automatically check service status on mount (default: true)
 * @param checkInterval - Interval for periodic checks in ms (default: 60000 = 1 minute, 0 = no periodic checks)
 * @returns Service status state and check functions
 */
export function useServiceStatus(autoCheck: boolean = true, checkInterval: number = 60000) {
  const [state, setState] = useState<ServicesState>(() => 
    getServiceStatusTracker().getState()
  );
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const tracker = getServiceStatusTracker();

    // Subscribe to status changes
    const unsubscribe = tracker.subscribe((newState) => {
      setState(newState);
    });

    // Perform initial check if requested
    if (autoCheck) {
      setIsChecking(true);
      tracker.checkAllServices().finally(() => {
        setIsChecking(false);
      });
    }

    // Start periodic checks if interval is set
    if (checkInterval > 0) {
      tracker.startPeriodicChecks(checkInterval);
    }

    // Cleanup
    return () => {
      unsubscribe();
      if (checkInterval > 0) {
        tracker.stopPeriodicChecks();
      }
    };
  }, [autoCheck, checkInterval]);

  /**
   * Manually trigger a service status check
   */
  const checkServices = async () => {
    setIsChecking(true);
    try {
      const tracker = getServiceStatusTracker();
      const newState = await tracker.checkAllServices();
      setState(newState);
      return newState;
    } finally {
      setIsChecking(false);
    }
  };

  /**
   * Check specific service
   */
  const checkService = async (service: 'gemini' | 'weather') => {
    setIsChecking(true);
    try {
      const tracker = getServiceStatusTracker();
      const status = await tracker.checkService(service);
      setState(tracker.getState());
      return status;
    } finally {
      setIsChecking(false);
    }
  };

  return {
    ...state,
    isChecking,
    checkServices,
    checkService
  };
}
