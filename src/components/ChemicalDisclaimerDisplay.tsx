import React from 'react';

/**
 * Restriction level for chemicals
 */
export type RestrictionLevel = 'banned' | 'restricted' | 'caution';

/**
 * Detected chemical information
 */
export interface DetectedChemical {
  name: string;
  variations: string[];
  restrictionLevel: RestrictionLevel;
  recommendation: string;
}

/**
 * Props for ChemicalDisclaimerDisplay component
 */
interface ChemicalDisclaimerDisplayProps {
  detectedChemicals?: DetectedChemical[];
  showAlways?: boolean; // Show disclaimer even without detected chemicals
}

/**
 * ChemicalDisclaimerDisplay Component
 * 
 * Displays chemical safety disclaimers and warnings for detected restricted chemicals.
 * 
 * Requirements:
 * - 10.1: Display disclaimer that database is incomplete
 * - 10.2: Show recommendation to consult local agricultural extension
 * - 10.4: Display warning when restricted chemical is detected
 * 
 * @param detectedChemicals - Array of detected restricted chemicals
 * @param showAlways - Whether to show disclaimer even without detected chemicals
 */
export function ChemicalDisclaimerDisplay({ 
  detectedChemicals = [], 
  showAlways = false 
}: ChemicalDisclaimerDisplayProps) {
  const hasRestrictedChemicals = detectedChemicals.length > 0;
  
  // Don't render if no chemicals detected and showAlways is false
  if (!hasRestrictedChemicals && !showAlways) {
    return null;
  }

  /**
   * Get appropriate styling based on restriction level
   */
  const getRestrictionLevelStyle = (level: RestrictionLevel) => {
    switch (level) {
      case 'banned':
        return {
          bg: 'bg-red-50',
          border: 'border-red-300',
          text: 'text-red-900',
          badge: 'bg-red-600 text-white'
        };
      case 'restricted':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-300',
          text: 'text-orange-900',
          badge: 'bg-orange-600 text-white'
        };
      case 'caution':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-300',
          text: 'text-yellow-900',
          badge: 'bg-yellow-600 text-white'
        };
    }
  };

  return (
    <div className="chemical-disclaimer-display p-4 bg-amber-50 rounded-lg border border-amber-300">
      {/* Main database disclaimer - Requirements 10.1, 10.2 */}
      <div className="database-disclaimer mb-4 p-3 bg-amber-100 border border-amber-400 rounded">
        <p className="text-sm font-semibold text-amber-900 mb-2">
          ⚠️ Chemical Database Disclaimer
        </p>
        <p className="text-sm text-amber-800 mb-2">
          <strong>Important:</strong> This chemical restriction database is incomplete and may not 
          reflect all local, regional, or national regulations.
        </p>
        <p className="text-sm text-amber-800">
          <strong>Always consult your local agricultural extension office</strong> or regulatory 
          authorities before applying any chemicals. Regulations vary by location and may change 
          over time.
        </p>
      </div>

      {/* Restricted chemicals warnings - Requirement 10.4 */}
      {hasRestrictedChemicals && (
        <div className="restricted-chemicals-section">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">
            Detected Restricted Chemicals:
          </h4>
          
          <div className="space-y-3">
            {detectedChemicals.map((chemical, index) => {
              const styles = getRestrictionLevelStyle(chemical.restrictionLevel);
              
              return (
                <div 
                  key={`${chemical.name}-${index}`}
                  className={`chemical-warning p-3 ${styles.bg} border ${styles.border} rounded`}
                >
                  {/* Chemical name and restriction level badge */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h5 className={`text-sm font-bold ${styles.text} capitalize`}>
                        {chemical.name}
                      </h5>
                      {chemical.variations.length > 1 && (
                        <p className="text-xs text-gray-600 mt-1">
                          Also known as: {chemical.variations.slice(1).join(', ')}
                        </p>
                      )}
                    </div>
                    <span 
                      className={`ml-2 px-2 py-1 text-xs font-semibold rounded uppercase ${styles.badge}`}
                      role="status"
                      aria-label={`Restriction level: ${chemical.restrictionLevel}`}
                    >
                      {chemical.restrictionLevel}
                    </span>
                  </div>
                  
                  {/* Specific recommendation for this chemical */}
                  <p className={`text-sm ${styles.text}`}>
                    <strong>⚠️ Warning:</strong> {chemical.recommendation}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Additional safety reminder */}
      <div className="safety-reminder mt-4 p-3 bg-gray-100 border border-gray-300 rounded">
        <p className="text-xs text-gray-700">
          <strong>Safety Reminder:</strong> Chemical regulations and restrictions vary by country, 
          state, and local jurisdiction. This information is provided for general awareness only 
          and should not be considered legal or regulatory advice. Always verify current regulations 
          with appropriate authorities before purchasing, storing, or applying any agricultural chemicals.
        </p>
      </div>
    </div>
  );
}
