/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fc from 'fast-check';
import { OfflineDetectorImpl, resetOfflineDetector } from '../OfflineDetector';

/**
 * Property-Based Tests for OfflineDetector
 * Feature: agricultural-accuracy-and-security-fixes
 */

describe('OfflineDetector - Property Tests', () => {
  let detector: OfflineDetectorImpl;

  beforeEach(() => {
    resetOfflineDetector();
    detector = new OfflineDetectorImpl();
  });

  afterEach(() => {
    detector.destroy();
    resetOfflineDetector();
  });

  /**
   * Property 36: Pre-call offline detection
   * For any API call attempt, the system should check offline status before making the request.
   * **Validates: Requirements 14.4**
   */
  it('Property 36: should detect offline status before API calls', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(), // online status
        async (shouldBeOnline) => {
          // Mock navigator.onLine
          Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: shouldBeOnline,
          });

          // Create a new detector to pick up the mocked value
          const testDetector = new OfflineDetectorImpl();

          try {
            // The detector should report the current online status
            const isOnline = testDetector.isOnline();
            expect(isOnline).toBe(shouldBeOnline);

            // If offline, checkAPIAvailability should return false immediately
            if (!shouldBeOnline) {
              const apiAvailable = await testDetector.checkAPIAvailability();
              expect(apiAvailable).toBe(false);
            }
          } finally {
            testDetector.destroy();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Status change callbacks should be notified
   */
  it('should notify all registered callbacks on status change', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }), // number of callbacks
        fc.boolean(), // initial online status
        fc.boolean(), // new online status
        (numCallbacks, initialOnline, newOnline) => {
          // Skip if status doesn't change
          if (initialOnline === newOnline) {
            return true;
          }

          // Mock initial status
          Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: initialOnline,
          });

          const testDetector = new OfflineDetectorImpl();
          const callbackResults: boolean[] = [];

          try {
            // Register multiple callbacks
            const unsubscribes: (() => void)[] = [];
            for (let i = 0; i < numCallbacks; i++) {
              const unsubscribe = testDetector.onStatusChange((online) => {
                callbackResults.push(online);
              });
              unsubscribes.push(unsubscribe);
            }

            // Trigger status change by dispatching event
            Object.defineProperty(navigator, 'onLine', {
              writable: true,
              value: newOnline,
            });

            const event = new Event(newOnline ? 'online' : 'offline');
            window.dispatchEvent(event);

            // All callbacks should have been called with the new status
            expect(callbackResults.length).toBe(numCallbacks);
            callbackResults.forEach((result) => {
              expect(result).toBe(newOnline);
            });

            // Cleanup
            unsubscribes.forEach((unsub) => unsub());
          } finally {
            testDetector.destroy();
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Unsubscribe should stop notifications
   */
  it('should stop notifying after unsubscribe', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // initial status
        fc.boolean(), // new status
        (initialOnline, newOnline) => {
          if (initialOnline === newOnline) {
            return true;
          }

          Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: initialOnline,
          });

          const testDetector = new OfflineDetectorImpl();
          let callbackCount = 0;

          try {
            // Register and immediately unsubscribe
            const unsubscribe = testDetector.onStatusChange(() => {
              callbackCount++;
            });
            unsubscribe();

            // Trigger status change
            Object.defineProperty(navigator, 'onLine', {
              writable: true,
              value: newOnline,
            });

            const event = new Event(newOnline ? 'online' : 'offline');
            window.dispatchEvent(event);

            // Callback should not have been called
            expect(callbackCount).toBe(0);
          } finally {
            testDetector.destroy();
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: isOnline should always return a boolean
   */
  it('should always return a boolean from isOnline', () => {
    fc.assert(
      fc.property(fc.boolean(), (onlineStatus) => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: onlineStatus,
        });

        const testDetector = new OfflineDetectorImpl();

        try {
          const result = testDetector.isOnline();
          expect(typeof result).toBe('boolean');
          expect(result).toBe(onlineStatus);
        } finally {
          testDetector.destroy();
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: checkAPIAvailability should return false when offline
   */
  it('should return false from checkAPIAvailability when offline', async () => {
    // Set navigator to offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const testDetector = new OfflineDetectorImpl();

    try {
      const available = await testDetector.checkAPIAvailability();
      expect(available).toBe(false);
    } finally {
      testDetector.destroy();
    }
  });
});
