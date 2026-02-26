import React from 'react';

export interface ConfidenceScore {
  overall: number; // 0-100
  components: {
    weatherData: number;
    imageAnalysis?: number;
    modelAccuracy: number;
  };
}

interface ConfidenceScoreDisplayProps {
  confidence: ConfidenceScore;
}

export function ConfidenceScoreDisplay({ confidence }: ConfidenceScoreDisplayProps) {
  const isLowConfidence = confidence.overall < 60;
  
  return (
    <div className="confidence-score-display p-4 bg-blue-50 rounded-lg border border-blue-200">
      {/* Main confidence score */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-800">Confidence Score</h3>
          <span className={`text-2xl font-bold ${
            isLowConfidence ? 'text-red-600' : 'text-blue-600'
          }`}>
            {confidence.overall}%
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${
              isLowConfidence ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ width: `${confidence.overall}%` }}
            role="progressbar"
            aria-valuenow={confidence.overall}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Overall confidence score"
          />
        </div>
      </div>
      
      {/* Experimental disclaimer */}
      <div className="experimental-disclaimer mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded">
        <p className="text-sm text-yellow-900 font-semibold mb-1">
          ⚠️ Experimental Metric
        </p>
        <p className="text-sm text-yellow-800">
          This confidence score is experimental and has not been scientifically validated. 
          It should be used as a general indicator only.
        </p>
      </div>
      
      {/* Low confidence warning */}
      {isLowConfidence && (
        <div className="low-confidence-warning mb-4 p-3 bg-red-50 border border-red-300 rounded">
          <p className="text-sm text-red-900 font-semibold mb-1">
            ⚠️ Low Confidence Warning
          </p>
          <p className="text-sm text-red-800">
            The confidence score is below 60%, indicating significant uncertainty in this analysis. 
            Please exercise extra caution and seek professional verification.
          </p>
        </div>
      )}
      
      {/* Confidence components breakdown */}
      <div className="confidence-breakdown mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Confidence Breakdown:</h4>
        <div className="space-y-2">
          {/* Weather Data Component */}
          <div className="component-item">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-700">Weather Data Quality</span>
              <span className="text-sm font-semibold text-gray-800">
                {confidence.components.weatherData}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500"
                style={{ width: `${confidence.components.weatherData}%` }}
                role="progressbar"
                aria-valuenow={confidence.components.weatherData}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Weather data confidence"
              />
            </div>
          </div>
          
          {/* Image Analysis Component (if available) */}
          {confidence.components.imageAnalysis !== undefined && (
            <div className="component-item">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700">Image Analysis Quality</span>
                <span className="text-sm font-semibold text-gray-800">
                  {confidence.components.imageAnalysis}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500"
                  style={{ width: `${confidence.components.imageAnalysis}%` }}
                  role="progressbar"
                  aria-valuenow={confidence.components.imageAnalysis}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Image analysis confidence"
                />
              </div>
            </div>
          )}
          
          {/* Model Accuracy Component */}
          <div className="component-item">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-700">Model Accuracy</span>
              <span className="text-sm font-semibold text-gray-800">
                {confidence.components.modelAccuracy}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500"
                style={{ width: `${confidence.components.modelAccuracy}%` }}
                role="progressbar"
                aria-valuenow={confidence.components.modelAccuracy}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Model accuracy confidence"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Professional consultation recommendation */}
      <div className="professional-recommendation p-3 bg-gray-100 border border-gray-300 rounded">
        <p className="text-sm text-gray-800">
          <strong>Important:</strong> This tool is for informational purposes only. 
          For critical agricultural decisions, always consult with qualified agricultural 
          professionals or extension services in your area.
        </p>
      </div>
    </div>
  );
}
