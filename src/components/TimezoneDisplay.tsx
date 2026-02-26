/**
 * Timezone Display Component
 * 
 * Displays current user timezone and allows manual selection
 * Requirements: 12.3, 12.5
 */

import React from 'react';
import { useTimezone } from '../hooks/useTimezone';

/**
 * Component to display and manage user timezone
 */
export function TimezoneDisplay() {
  const {
    timezone,
    detectionMethod,
    isLoading,
    error,
    getOffsetString
  } = useTimezone();

  if (isLoading) {
    return (
      <div className="text-sm text-gray-500">
        Detecting timezone...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="text-sm text-gray-600">
      <span className="font-medium">Timezone:</span> {timezone} ({getOffsetString()})
      {detectionMethod === 'browser' && (
        <span className="ml-2 text-xs text-gray-400">(auto-detected)</span>
      )}
    </div>
  );
}

/**
 * Component to display a timestamp in user's timezone
 */
export function TimestampDisplay({ 
  timestamp,
  label 
}: { 
  timestamp: Date | string;
  label?: string;
}) {
  const { formatTimestamp } = useTimezone();

  return (
    <div className="text-sm">
      {label && <span className="font-medium">{label}: </span>}
      <span>{formatTimestamp(timestamp)}</span>
    </div>
  );
}
