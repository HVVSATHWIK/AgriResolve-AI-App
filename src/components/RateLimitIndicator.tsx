import React from 'react';

export interface RateLimitState {
  requestsRemaining: number;
  totalQuota: number;
  cooldownUntil: Date | null;
  lastRequestTime: Date | null;
}

interface RateLimitIndicatorProps {
  state: RateLimitState;
}

function formatCooldownTime(cooldownUntil: Date): string {
  const now = new Date();
  const diffMs = cooldownUntil.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return '0 seconds';
  }
  
  const diffSeconds = Math.ceil(diffMs / 1000);
  const minutes = Math.floor(diffSeconds / 60);
  const seconds = diffSeconds % 60;
  
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  
  return `${seconds} second${seconds !== 1 ? 's' : ''}`;
}

export function RateLimitIndicator({ state }: RateLimitIndicatorProps) {
  const percentUsed = ((state.totalQuota - state.requestsRemaining) / state.totalQuota) * 100;
  const isNearLimit = percentUsed >= 80;
  
  return (
    <div className="rate-limit-indicator p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="mb-2">
        <div className="quota-bar h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`quota-fill h-full transition-all duration-300 ${
              isNearLimit ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${percentUsed}%` }}
            role="progressbar"
            aria-valuenow={percentUsed}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>
      
      <div className="quota-text text-sm text-gray-700">
        {state.requestsRemaining} / {state.totalQuota} requests remaining
      </div>
      
      {isNearLimit && !state.cooldownUntil && (
        <div className="quota-warning mt-2 text-sm text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200">
          ⚠️ Approaching rate limit. {state.requestsRemaining} requests left.
        </div>
      )}
      
      {state.cooldownUntil && (
        <div className="cooldown-message mt-2 text-sm text-red-700 bg-red-50 p-2 rounded border border-red-200">
          ⏱️ Cooldown active. Try again in {formatCooldownTime(state.cooldownUntil)}
        </div>
      )}
    </div>
  );
}
