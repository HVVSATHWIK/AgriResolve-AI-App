import React, { useEffect, useState } from 'react';
import { getOfflineDetector } from '../services/OfflineDetector';

/**
 * OfflineBanner - Displays offline mode messaging and feature availability
 * Feature: agricultural-accuracy-and-security-fixes
 * Requirements: 14.1, 14.2, 14.3, 14.5
 */

interface OfflineBannerProps {
  showFeatureList?: boolean;
}

export function OfflineBanner({ showFeatureList = true }: OfflineBannerProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    const detector = getOfflineDetector();

    // Set initial status
    setIsOnline(detector.isOnline());

    // Subscribe to status changes
    const unsubscribe = detector.onStatusChange((online) => {
      setIsOnline(online);

      // Show reconnection notification briefly
      if (online) {
        setJustReconnected(true);
        setTimeout(() => setJustReconnected(false), 5000);
      }
    });

    // Cleanup on unmount
    return unsubscribe;
  }, []);

  // Show reconnection notification
  if (justReconnected) {
    return (
      <div
        className="online-notification bg-green-50 border-l-4 border-green-500 p-4 mb-4"
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-green-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-green-700 font-medium">
              ✓ Connection restored. Online features are now available.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Don't show anything if online
  if (isOnline) {
    return null;
  }

  // Show offline banner
  return (
    <div
      className="offline-banner bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-yellow-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            No Internet Connection
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              You are currently offline. Some features require an internet
              connection to work.
            </p>
            {showFeatureList && (
              <div className="mt-3">
                <p className="font-medium mb-1">Features requiring internet:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Crop disease analysis</li>
                  <li>AI-powered image recognition</li>
                  <li>Weather data integration</li>
                  <li>Disease risk calculations</li>
                  <li>Chemical safety recommendations</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * OfflineFeatureMessage - Shows a specific message when a feature is unavailable offline
 * Requirements: 14.5
 */

interface OfflineFeatureMessageProps {
  featureName: string;
  message?: string;
}

export function OfflineFeatureMessage({
  featureName,
  message,
}: OfflineFeatureMessageProps) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const detector = getOfflineDetector();
    setIsOnline(detector.isOnline());

    const unsubscribe = detector.onStatusChange(setIsOnline);
    return unsubscribe;
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div
      className="offline-feature-message bg-gray-50 border border-gray-300 rounded-lg p-4 text-center"
      role="alert"
    >
      <svg
        className="mx-auto h-12 w-12 text-gray-400 mb-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
        />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {featureName} Unavailable
      </h3>
      <p className="text-sm text-gray-600">
        {message ||
          `${featureName} requires an internet connection. Please check your connection and try again.`}
      </p>
    </div>
  );
}
