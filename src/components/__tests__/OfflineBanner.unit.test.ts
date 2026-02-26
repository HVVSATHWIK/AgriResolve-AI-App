/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { render, act, waitFor } from '@testing-library/react';
import * as React from 'react';
import { OfflineBanner, OfflineFeatureMessage } from '../OfflineBanner';
import { resetOfflineDetector } from '../../services/OfflineDetector';

/**
 * Unit Tests for OfflineBanner and OfflineFeatureMessage Components
 * Feature: agricultural-accuracy-and-security-fixes
 * Tests specific UI states for offline mode
 */

describe('OfflineBanner - Unit Tests', () => {
  beforeEach(() => {
    resetOfflineDetector();
  });

  afterEach(() => {
    resetOfflineDetector();
  });

  /**
   * Test offline banner display when navigator.onLine = false
   * Requirements: 14.1, 14.2, 14.3, 14.5
   */
  it('should display offline banner when navigator.onLine = false', async () => {
    // Mock navigator.onLine to false
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const { container } = render(React.createElement(OfflineBanner, {}));

    await waitFor(() => {
      const banner = container.querySelector('.offline-banner');
      expect(banner).toBeTruthy();
      expect(banner?.textContent).toContain('No Internet Connection');
      expect(banner?.textContent).toContain('You are currently offline');
    });
  });

  /**
   * Test that banner shows feature list by default
   * Requirements: 14.2
   */
  it('should show feature list when offline', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const { container } = render(React.createElement(OfflineBanner, {}));

    await waitFor(() => {
      const banner = container.querySelector('.offline-banner');
      expect(banner?.textContent).toContain('Features requiring internet:');
      expect(banner?.textContent).toContain('Crop disease analysis');
      expect(banner?.textContent).toContain('AI-powered image recognition');
      expect(banner?.textContent).toContain('Weather data integration');
      expect(banner?.textContent).toContain('Disease risk calculations');
      expect(banner?.textContent).toContain('Chemical safety recommendations');
    });
  });

  /**
   * Test online notification when connection restored
   * Requirements: 14.3
   */
  it('should display online notification when connection restored', async () => {
    // Start offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const { container } = render(React.createElement(OfflineBanner, {}));

    // Wait for offline banner
    await waitFor(() => {
      expect(container.querySelector('.offline-banner')).toBeTruthy();
    });

    // Simulate going online
    await act(async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));
    });

    // Should show online notification
    await waitFor(() => {
      const notification = container.querySelector('.online-notification');
      expect(notification).toBeTruthy();
      expect(notification?.textContent).toContain('Connection restored');
      expect(notification?.textContent).toContain('Online features are now available');
    });
  });

  /**
   * Test that nothing is shown when online
   * Requirements: 14.1
   */
  it('should not display banner when online', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    const { container } = render(React.createElement(OfflineBanner, {}));

    const banner = container.querySelector('.offline-banner');
    expect(banner).toBeFalsy();

    const notification = container.querySelector('.online-notification');
    expect(notification).toBeFalsy();
  });

  /**
   * Test feature list can be hidden
   * Requirements: 14.2
   */
  it('should hide feature list when showFeatureList is false', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const { container } = render(
      React.createElement(OfflineBanner, { showFeatureList: false })
    );

    await waitFor(() => {
      const banner = container.querySelector('.offline-banner');
      expect(banner).toBeTruthy();
      expect(banner?.textContent).not.toContain('Features requiring internet:');
    });
  });
});

describe('OfflineFeatureMessage - Unit Tests', () => {
  beforeEach(() => {
    resetOfflineDetector();
  });

  afterEach(() => {
    resetOfflineDetector();
  });

  /**
   * Test feature unavailable message when offline
   * Requirements: 14.5
   */
  it('should display feature unavailable message when offline', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const { container } = render(
      React.createElement(OfflineFeatureMessage, {
        featureName: 'Disease Analysis',
      })
    );

    await waitFor(() => {
      const message = container.querySelector('.offline-feature-message');
      expect(message).toBeTruthy();
      expect(message?.textContent).toContain('Disease Analysis Unavailable');
      expect(message?.textContent).toContain('requires an internet connection');
    });
  });

  /**
   * Test custom message
   * Requirements: 14.5
   */
  it('should display custom message when provided', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const customMessage = 'This feature needs internet to fetch weather data.';

    const { container } = render(
      React.createElement(OfflineFeatureMessage, {
        featureName: 'Weather Integration',
        message: customMessage,
      })
    );

    await waitFor(() => {
      const message = container.querySelector('.offline-feature-message');
      expect(message).toBeTruthy();
      expect(message?.textContent).toContain(customMessage);
    });
  });

  /**
   * Test that nothing is shown when online
   * Requirements: 14.5
   */
  it('should not display message when online', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    const { container } = render(
      React.createElement(OfflineFeatureMessage, {
        featureName: 'Disease Analysis',
      })
    );

    const message = container.querySelector('.offline-feature-message');
    expect(message).toBeFalsy();
  });

  /**
   * Test accessibility attributes
   * Requirements: 14.5
   */
  it('should have proper accessibility attributes', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const { container } = render(
      React.createElement(OfflineFeatureMessage, {
        featureName: 'Disease Analysis',
      })
    );

    await waitFor(() => {
      const message = container.querySelector('.offline-feature-message');
      expect(message?.getAttribute('role')).toBe('alert');
    });
  });
});
