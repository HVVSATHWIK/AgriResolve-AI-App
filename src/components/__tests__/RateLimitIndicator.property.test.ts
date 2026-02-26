/**
 * @jest-environment jsdom
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import * as React from 'react';
import { RateLimitIndicator, RateLimitState } from '../RateLimitIndicator';

/**
 * Property-Based Tests for RateLimitIndicator Component
 * Feature: agricultural-accuracy-and-security-fixes
 */

describe('RateLimitIndicator - Property Tests', () => {
  /**
   * Property 16: Usage indicator updates
   * For any analysis request completion, the system should update the displayed 
   * usage indicators to reflect the new request count.
   * **Validates: Requirements 15.5**
   */
  it('Property 16: should display updated request count after any request', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20 }), // requestsRemaining
        fc.integer({ min: 1, max: 20 }), // totalQuota
        (requestsRemaining, totalQuota) => {
          // Ensure requestsRemaining doesn't exceed totalQuota
          const validRequestsRemaining = Math.min(requestsRemaining, totalQuota);
          
          const state: RateLimitState = {
            requestsRemaining: validRequestsRemaining,
            totalQuota,
            cooldownUntil: null,
            lastRequestTime: new Date(),
          };
          
          const { container, unmount } = render(React.createElement(RateLimitIndicator, { state }));
          
          try {
            // Verify the indicator displays the current request count
            const quotaText = container.querySelector('.quota-text');
            expect(quotaText).toBeTruthy();
            expect(quotaText?.textContent).toContain(`${validRequestsRemaining} / ${totalQuota} requests remaining`);
            
            // Verify the progress bar reflects the usage percentage
            const progressBar = container.querySelector('.quota-fill');
            expect(progressBar).toBeTruthy();
            
            const percentUsed = ((totalQuota - validRequestsRemaining) / totalQuota) * 100;
            const width = progressBar?.getAttribute('style');
            expect(width).toContain(`${percentUsed}%`);
            
            // Verify aria attributes for accessibility
            expect(progressBar?.getAttribute('aria-valuenow')).toBe(percentUsed.toString());
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Usage indicator should show warning when approaching limit
   */
  it('should show warning when usage exceeds 80%', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }), // totalQuota
        (totalQuota) => {
          // Calculate requestsRemaining that results in >80% usage
          const requestsRemaining = Math.floor(totalQuota * 0.19); // 81% used
          
          const state: RateLimitState = {
            requestsRemaining,
            totalQuota,
            cooldownUntil: null,
            lastRequestTime: new Date(),
          };
          
          const { container, unmount } = render(React.createElement(RateLimitIndicator, { state }));
          
          try {
            // Should show warning
            const warning = container.querySelector('.quota-warning');
            expect(warning).toBeTruthy();
            expect(warning?.textContent).toContain('Approaching rate limit');
            expect(warning?.textContent).toContain(`${requestsRemaining} requests left`);
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Usage indicator should not show warning when below 80%
   */
  it('should not show warning when usage is below 80%', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 20 }), // totalQuota (min 5 to ensure we can have <80%)
        (totalQuota) => {
          // Calculate requestsRemaining that results in <80% usage
          const requestsRemaining = Math.ceil(totalQuota * 0.21); // 79% used
          
          const state: RateLimitState = {
            requestsRemaining,
            totalQuota,
            cooldownUntil: null,
            lastRequestTime: new Date(),
          };
          
          const { container, unmount } = render(React.createElement(RateLimitIndicator, { state }));
          
          try {
            // Should not show warning
            const warning = container.querySelector('.quota-warning');
            expect(warning).toBeFalsy();
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Cooldown message should be displayed when cooldown is active
   */
  it('should display cooldown message when cooldownUntil is set', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20 }), // requestsRemaining
        fc.integer({ min: 1, max: 20 }), // totalQuota
        fc.integer({ min: 1, max: 600 }), // cooldown seconds (1-600 seconds)
        (requestsRemaining, totalQuota, cooldownSeconds) => {
          const validRequestsRemaining = Math.min(requestsRemaining, totalQuota);
          const cooldownUntil = new Date(Date.now() + cooldownSeconds * 1000);
          
          const state: RateLimitState = {
            requestsRemaining: validRequestsRemaining,
            totalQuota,
            cooldownUntil,
            lastRequestTime: new Date(),
          };
          
          const { container, unmount } = render(React.createElement(RateLimitIndicator, { state }));
          
          try {
            // Should show cooldown message
            const cooldownMessage = container.querySelector('.cooldown-message');
            expect(cooldownMessage).toBeTruthy();
            expect(cooldownMessage?.textContent).toContain('Cooldown active');
            expect(cooldownMessage?.textContent).toContain('Try again in');
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
