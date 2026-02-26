/**
 * @jest-environment jsdom
 */

/**
 * Property-based tests for ConfidenceScoreDisplay component
 * 
 * Tests universal properties that should hold across all valid confidence scores.
 * Uses fast-check for property-based testing with minimum 100 iterations.
 * 
 * Feature: agricultural-accuracy-and-security-fixes
 */

/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { ConfidenceScoreDisplay, ConfidenceScore } from '../ConfidenceScoreDisplay';
import React from 'react';
import * as fc from 'fast-check';

describe('ConfidenceScoreDisplay - Property Tests', () => {
  /**
   * Property 23: Confidence score disclaimer display
   * 
   * For any page or component displaying confidence scores, the system should show 
   * a disclaimer that scores are experimental, provide a breakdown of confidence 
   * components, and recommend consulting professionals.
   * 
   * **Validates: Requirements 9.1, 9.2, 9.3**
   */
  test('Property 23: should always display experimental disclaimer, component breakdown, and professional recommendation', () => {
    fc.assert(
      fc.property(
        // Generate random confidence scores (0-100)
        fc.record({
          overall: fc.integer({ min: 0, max: 100 }),
          components: fc.record({
            weatherData: fc.integer({ min: 0, max: 100 }),
            imageAnalysis: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
            modelAccuracy: fc.integer({ min: 0, max: 100 })
          })
        }),
        (confidence: ConfidenceScore) => {
          const { unmount } = render(<ConfidenceScoreDisplay confidence={confidence} />);
          
          // 1. Should show experimental disclaimer (Requirement 9.1)
          const experimentalDisclaimer = screen.getByText(/Experimental Metric/i);
          expect(experimentalDisclaimer).toBeInTheDocument();
          expect(screen.getByText(/not been scientifically validated/i)).toBeInTheDocument();
          
          // 2. Should show component breakdown (Requirement 9.3)
          expect(screen.getByText(/Confidence Breakdown/i)).toBeInTheDocument();
          expect(screen.getByText(/Weather Data Quality/i)).toBeInTheDocument();
          expect(screen.getByText(/Model Accuracy/i)).toBeInTheDocument();
          
          // If imageAnalysis is present, it should be shown
          if (confidence.components.imageAnalysis !== undefined) {
            expect(screen.getByText(/Image Analysis Quality/i)).toBeInTheDocument();
          }
          
          // 3. Should recommend consulting professionals (Requirement 9.2)
          expect(screen.getByText(/consult with qualified agricultural professionals/i)).toBeInTheDocument();
          
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Property 24: Low confidence warning
   * 
   * For any confidence score below 60%, the system should display an additional 
   * warning about low confidence beyond the standard disclaimer.
   * 
   * **Validates: Requirements 9.5**
   */
  test('Property 24: should display additional warning when confidence < 60%', () => {
    fc.assert(
      fc.property(
        // Generate random confidence scores
        fc.integer({ min: 0, max: 100 }),
        fc.record({
          weatherData: fc.integer({ min: 0, max: 100 }),
          imageAnalysis: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
          modelAccuracy: fc.integer({ min: 0, max: 100 })
        }),
        (overall: number, components) => {
          const confidence: ConfidenceScore = {
            overall,
            components
          };
          
          const { unmount } = render(<ConfidenceScoreDisplay confidence={confidence} />);
          
          if (overall < 60) {
            // Should show low confidence warning
            expect(screen.getByText(/Low Confidence Warning/i)).toBeInTheDocument();
            expect(screen.getByText(/below 60%/i)).toBeInTheDocument();
          } else {
            // Should NOT show low confidence warning
            expect(screen.queryByText(/Low Confidence Warning/i)).not.toBeInTheDocument();
          }
          
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Additional property: Overall confidence score should always be displayed
   */
  test('Property: should always display the overall confidence score', () => {
    fc.assert(
      fc.property(
        fc.record({
          overall: fc.integer({ min: 0, max: 100 }),
          components: fc.record({
            weatherData: fc.integer({ min: 0, max: 100 }),
            imageAnalysis: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
            modelAccuracy: fc.integer({ min: 0, max: 100 })
          })
        }),
        (confidence: ConfidenceScore) => {
          const { unmount } = render(<ConfidenceScoreDisplay confidence={confidence} />);
          
          // Should display the overall confidence score
          // Use the progress bar to verify the value since text might appear multiple times
          const progressBar = screen.getByLabelText('Overall confidence score');
          expect(progressBar).toHaveAttribute('aria-valuenow', confidence.overall.toString());
          
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Additional property: Component values should always be displayed
   */
  test('Property: should display all component confidence values', () => {
    fc.assert(
      fc.property(
        fc.record({
          overall: fc.integer({ min: 0, max: 100 }),
          components: fc.record({
            weatherData: fc.integer({ min: 0, max: 100 }),
            imageAnalysis: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
            modelAccuracy: fc.integer({ min: 0, max: 100 })
          })
        }),
        (confidence: ConfidenceScore) => {
          const { unmount } = render(<ConfidenceScoreDisplay confidence={confidence} />);
          
          // Weather data component should always be displayed
          expect(screen.getByLabelText('Weather data confidence')).toHaveAttribute(
            'aria-valuenow',
            confidence.components.weatherData.toString()
          );
          
          // Model accuracy component should always be displayed
          expect(screen.getByLabelText('Model accuracy confidence')).toHaveAttribute(
            'aria-valuenow',
            confidence.components.modelAccuracy.toString()
          );
          
          // Image analysis component should be displayed if present
          if (confidence.components.imageAnalysis !== undefined) {
            expect(screen.getByLabelText('Image analysis confidence')).toHaveAttribute(
              'aria-valuenow',
              confidence.components.imageAnalysis.toString()
            );
          } else {
            expect(screen.queryByLabelText('Image analysis confidence')).not.toBeInTheDocument();
          }
          
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Additional property: Progress bar widths should match confidence values
   */
  test('Property: progress bar widths should correspond to confidence percentages', () => {
    fc.assert(
      fc.property(
        fc.record({
          overall: fc.integer({ min: 0, max: 100 }),
          components: fc.record({
            weatherData: fc.integer({ min: 0, max: 100 }),
            imageAnalysis: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
            modelAccuracy: fc.integer({ min: 0, max: 100 })
          })
        }),
        (confidence: ConfidenceScore) => {
          const { unmount } = render(<ConfidenceScoreDisplay confidence={confidence} />);
          
          // Overall progress bar
          const overallBar = screen.getByLabelText('Overall confidence score');
          expect(overallBar).toHaveAttribute('aria-valuenow', confidence.overall.toString());
          expect(overallBar).toHaveAttribute('aria-valuemin', '0');
          expect(overallBar).toHaveAttribute('aria-valuemax', '100');
          
          // Component progress bars
          const weatherBar = screen.getByLabelText('Weather data confidence');
          expect(weatherBar).toHaveAttribute('aria-valuenow', confidence.components.weatherData.toString());
          
          const modelBar = screen.getByLabelText('Model accuracy confidence');
          expect(modelBar).toHaveAttribute('aria-valuenow', confidence.components.modelAccuracy.toString());
          
          if (confidence.components.imageAnalysis !== undefined) {
            const imageBar = screen.getByLabelText('Image analysis confidence');
            expect(imageBar).toHaveAttribute('aria-valuenow', confidence.components.imageAnalysis.toString());
          }
          
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
