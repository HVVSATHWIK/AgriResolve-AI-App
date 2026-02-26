/**
 * @jest-environment jsdom
 */

import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
import * as React from 'react';
import { RateLimitIndicator, RateLimitState } from '../RateLimitIndicator';

/**
 * Unit Tests for RateLimitIndicator Component
 * Feature: agricultural-accuracy-and-security-fixes
 * Tests specific UI states and edge cases
 */

describe('RateLimitIndicator - Unit Tests', () => {
  /**
   * Test display at 0% usage (20/20 remaining)
   * Requirements: 7.3, 7.4, 15.3
   */
  it('should display correctly at 0% usage (20/20 remaining)', () => {
    const state: RateLimitState = {
      requestsRemaining: 20,
      totalQuota: 20,
      cooldownUntil: null,
      lastRequestTime: null,
    };

    const { container } = render(React.createElement(RateLimitIndicator, { state }));

    // Check quota text
    const quotaText = container.querySelector('.quota-text');
    expect(quotaText?.textContent).toContain('20 / 20 requests remaining');

    // Check progress bar is at 0%
    const progressBar = container.querySelector('.quota-fill');
    expect(progressBar?.getAttribute('style')).toContain('width: 0%');
    expect(progressBar?.getAttribute('aria-valuenow')).toBe('0');

    // Should use green color (not near limit)
    expect(progressBar?.className).toContain('bg-green-500');
    expect(progressBar?.className).not.toContain('bg-yellow-500');

    // Should not show warning
    const warning = container.querySelector('.quota-warning');
    expect(warning).toBeFalsy();

    // Should not show cooldown
    const cooldown = container.querySelector('.cooldown-message');
    expect(cooldown).toBeFalsy();
  });

  /**
   * Test display at 80% usage (4/20 remaining) - should show warning
   * Requirements: 7.3, 7.4, 15.3
   */
  it('should display warning at 80% usage (4/20 remaining)', () => {
    const state: RateLimitState = {
      requestsRemaining: 4,
      totalQuota: 20,
      cooldownUntil: null,
      lastRequestTime: new Date(),
    };

    const { container } = render(React.createElement(RateLimitIndicator, { state }));

    // Check quota text
    const quotaText = container.querySelector('.quota-text');
    expect(quotaText?.textContent).toContain('4 / 20 requests remaining');

    // Check progress bar is at 80%
    const progressBar = container.querySelector('.quota-fill');
    expect(progressBar?.getAttribute('style')).toContain('width: 80%');
    expect(progressBar?.getAttribute('aria-valuenow')).toBe('80');

    // Should use yellow color (near limit)
    expect(progressBar?.className).toContain('bg-yellow-500');
    expect(progressBar?.className).not.toContain('bg-green-500');

    // Should show warning
    const warning = container.querySelector('.quota-warning');
    expect(warning).toBeTruthy();
    expect(warning?.textContent).toContain('Approaching rate limit');
    expect(warning?.textContent).toContain('4 requests left');

    // Should not show cooldown
    const cooldown = container.querySelector('.cooldown-message');
    expect(cooldown).toBeFalsy();
  });

  /**
   * Test display at 100% usage (0/20 remaining) - should show cooldown
   * Requirements: 7.3, 7.4, 15.3
   */
  it('should display cooldown at 100% usage (0/20 remaining)', () => {
    const cooldownTime = new Date(Date.now() + 300000); // 5 minutes from now
    const state: RateLimitState = {
      requestsRemaining: 0,
      totalQuota: 20,
      cooldownUntil: cooldownTime,
      lastRequestTime: new Date(),
    };

    const { container } = render(React.createElement(RateLimitIndicator, { state }));

    // Check quota text
    const quotaText = container.querySelector('.quota-text');
    expect(quotaText?.textContent).toContain('0 / 20 requests remaining');

    // Check progress bar is at 100%
    const progressBar = container.querySelector('.quota-fill');
    expect(progressBar?.getAttribute('style')).toContain('width: 100%');
    expect(progressBar?.getAttribute('aria-valuenow')).toBe('100');

    // Should use yellow color
    expect(progressBar?.className).toContain('bg-yellow-500');

    // Should show cooldown message
    const cooldown = container.querySelector('.cooldown-message');
    expect(cooldown).toBeTruthy();
    expect(cooldown?.textContent).toContain('Cooldown active');
    expect(cooldown?.textContent).toContain('Try again in');
    expect(cooldown?.textContent).toContain('minute');

    // Warning should not be shown when cooldown is active
    const warning = container.querySelector('.quota-warning');
    expect(warning).toBeFalsy();
  });

  /**
   * Test cooldown timer countdown
   * Requirements: 7.3, 7.4
   */
  it('should display cooldown timer with correct time remaining', () => {
    // Test with 90 seconds remaining
    const cooldownTime = new Date(Date.now() + 90000);
    const state: RateLimitState = {
      requestsRemaining: 0,
      totalQuota: 20,
      cooldownUntil: cooldownTime,
      lastRequestTime: new Date(),
    };

    const { container } = render(React.createElement(RateLimitIndicator, { state }));

    const cooldown = container.querySelector('.cooldown-message');
    expect(cooldown).toBeTruthy();
    expect(cooldown?.textContent).toContain('1 minute');
    expect(cooldown?.textContent).toContain('30 second');
  });

  /**
   * Test edge case: exactly at 80% threshold
   * Requirements: 15.3
   */
  it('should show warning at exactly 80% usage', () => {
    const state: RateLimitState = {
      requestsRemaining: 4,
      totalQuota: 20,
      cooldownUntil: null,
      lastRequestTime: new Date(),
    };

    const { container } = render(React.createElement(RateLimitIndicator, { state }));

    // Should show warning at exactly 80%
    const warning = container.querySelector('.quota-warning');
    expect(warning).toBeTruthy();
  });

  /**
   * Test edge case: just below 80% threshold
   * Requirements: 15.3
   */
  it('should not show warning at 79% usage', () => {
    const state: RateLimitState = {
      requestsRemaining: 5,
      totalQuota: 20,
      cooldownUntil: null,
      lastRequestTime: new Date(),
    };

    const { container } = render(React.createElement(RateLimitIndicator, { state }));

    // Should not show warning at 75% (below 80%)
    const warning = container.querySelector('.quota-warning');
    expect(warning).toBeFalsy();

    // Should still use green color
    const progressBar = container.querySelector('.quota-fill');
    expect(progressBar?.className).toContain('bg-green-500');
  });

  /**
   * Test with very short cooldown (< 1 minute)
   * Requirements: 7.4
   */
  it('should display cooldown in seconds when less than 1 minute', () => {
    const cooldownTime = new Date(Date.now() + 30000); // 30 seconds
    const state: RateLimitState = {
      requestsRemaining: 0,
      totalQuota: 20,
      cooldownUntil: cooldownTime,
      lastRequestTime: new Date(),
    };

    const { container } = render(React.createElement(RateLimitIndicator, { state }));

    const cooldown = container.querySelector('.cooldown-message');
    expect(cooldown).toBeTruthy();
    expect(cooldown?.textContent).toContain('30 second');
    expect(cooldown?.textContent).not.toContain('minute');
  });

  /**
   * Test accessibility attributes
   * Requirements: 15.3
   */
  it('should have proper accessibility attributes', () => {
    const state: RateLimitState = {
      requestsRemaining: 10,
      totalQuota: 20,
      cooldownUntil: null,
      lastRequestTime: new Date(),
    };

    const { container } = render(React.createElement(RateLimitIndicator, { state }));

    const progressBar = container.querySelector('.quota-fill');
    expect(progressBar?.getAttribute('role')).toBe('progressbar');
    expect(progressBar?.getAttribute('aria-valuemin')).toBe('0');
    expect(progressBar?.getAttribute('aria-valuemax')).toBe('100');
    expect(progressBar?.getAttribute('aria-valuenow')).toBe('50');
  });
});
