/**
 * @jest-environment jsdom
 */

/**
 * Unit tests for ConfidenceScoreDisplay component
 * 
 * Tests specific examples and edge cases for confidence score display
 * including threshold behavior and component visibility.
 * 
 * Requirements: 9.3, 9.5
 */

/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { ConfidenceScoreDisplay, ConfidenceScore } from '../ConfidenceScoreDisplay';
import React from 'react';

describe('ConfidenceScoreDisplay - Unit Tests', () => {
  describe('Low confidence threshold (Requirement 9.5)', () => {
    test('should show extra warning when confidence = 59%', () => {
      const confidence: ConfidenceScore = {
        overall: 59,
        components: {
          weatherData: 60,
          imageAnalysis: 55,
          modelAccuracy: 62
        }
      };
      
      render(<ConfidenceScoreDisplay confidence={confidence} />);
      
      // Should show low confidence warning
      expect(screen.getByText(/Low Confidence Warning/i)).toBeInTheDocument();
      expect(screen.getByText(/below 60%/i)).toBeInTheDocument();
    });
    
    test('should NOT show extra warning when confidence = 60%', () => {
      const confidence: ConfidenceScore = {
        overall: 60,
        components: {
          weatherData: 60,
          imageAnalysis: 60,
          modelAccuracy: 60
        }
      };
      
      render(<ConfidenceScoreDisplay confidence={confidence} />);
      
      // Should NOT show low confidence warning
      expect(screen.queryByText(/Low Confidence Warning/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/below 60%/i)).not.toBeInTheDocument();
    });
    
    test('should NOT show extra warning when confidence = 61%', () => {
      const confidence: ConfidenceScore = {
        overall: 61,
        components: {
          weatherData: 65,
          imageAnalysis: 60,
          modelAccuracy: 58
        }
      };
      
      render(<ConfidenceScoreDisplay confidence={confidence} />);
      
      // Should NOT show low confidence warning
      expect(screen.queryByText(/Low Confidence Warning/i)).not.toBeInTheDocument();
    });
  });
  
  describe('Component breakdown display (Requirement 9.3)', () => {
    test('should show all three components in breakdown', () => {
      const confidence: ConfidenceScore = {
        overall: 75,
        components: {
          weatherData: 80,
          imageAnalysis: 70,
          modelAccuracy: 75
        }
      };
      
      render(<ConfidenceScoreDisplay confidence={confidence} />);
      
      // Check that all three components are displayed
      expect(screen.getByText(/Weather Data Quality/i)).toBeInTheDocument();
      expect(screen.getByText(/Image Analysis Quality/i)).toBeInTheDocument();
      expect(screen.getByText(/Model Accuracy/i)).toBeInTheDocument();
      
      // Check that component values are displayed using getAllByText for duplicates
      expect(screen.getByText('80%')).toBeInTheDocument(); // weatherData
      expect(screen.getByText('70%')).toBeInTheDocument(); // imageAnalysis
      expect(screen.getAllByText('75%')).toHaveLength(2); // modelAccuracy and overall
    });
    
    test('should handle missing imageAnalysis component', () => {
      const confidence: ConfidenceScore = {
        overall: 70,
        components: {
          weatherData: 75,
          modelAccuracy: 65
        }
      };
      
      render(<ConfidenceScoreDisplay confidence={confidence} />);
      
      // Should show weather data and model accuracy
      expect(screen.getByText(/Weather Data Quality/i)).toBeInTheDocument();
      expect(screen.getByText(/Model Accuracy/i)).toBeInTheDocument();
      
      // Should NOT show image analysis
      expect(screen.queryByText(/Image Analysis Quality/i)).not.toBeInTheDocument();
    });
  });
  
  describe('Disclaimer display (Requirements 9.1, 9.2)', () => {
    test('should always show experimental disclaimer', () => {
      const confidence: ConfidenceScore = {
        overall: 85,
        components: {
          weatherData: 90,
          imageAnalysis: 85,
          modelAccuracy: 80
        }
      };
      
      render(<ConfidenceScoreDisplay confidence={confidence} />);
      
      // Check for experimental disclaimer
      expect(screen.getByText(/Experimental Metric/i)).toBeInTheDocument();
      expect(screen.getByText(/not been scientifically validated/i)).toBeInTheDocument();
    });
    
    test('should always show professional consultation recommendation', () => {
      const confidence: ConfidenceScore = {
        overall: 90,
        components: {
          weatherData: 95,
          imageAnalysis: 90,
          modelAccuracy: 85
        }
      };
      
      render(<ConfidenceScoreDisplay confidence={confidence} />);
      
      // Check for professional recommendation
      expect(screen.getByText(/consult with qualified agricultural professionals/i)).toBeInTheDocument();
    });
  });
  
  describe('Edge cases', () => {
    test('should handle confidence = 0%', () => {
      const confidence: ConfidenceScore = {
        overall: 0,
        components: {
          weatherData: 0,
          imageAnalysis: 0,
          modelAccuracy: 0
        }
      };
      
      render(<ConfidenceScoreDisplay confidence={confidence} />);
      
      // Should display 0% and show low confidence warning
      const overallScore = screen.getByRole('heading', { name: /Confidence Score/i }).nextElementSibling;
      expect(overallScore).toHaveTextContent('0%');
      expect(screen.getByText(/Low Confidence Warning/i)).toBeInTheDocument();
    });
    
    test('should handle confidence = 100%', () => {
      const confidence: ConfidenceScore = {
        overall: 100,
        components: {
          weatherData: 100,
          imageAnalysis: 100,
          modelAccuracy: 100
        }
      };
      
      render(<ConfidenceScoreDisplay confidence={confidence} />);
      
      // Should display 100% and NOT show low confidence warning
      const overallScore = screen.getByRole('heading', { name: /Confidence Score/i }).nextElementSibling;
      expect(overallScore).toHaveTextContent('100%');
      expect(screen.queryByText(/Low Confidence Warning/i)).not.toBeInTheDocument();
    });
    
    test('should handle confidence = 1% (just above 0)', () => {
      const confidence: ConfidenceScore = {
        overall: 1,
        components: {
          weatherData: 1,
          imageAnalysis: 1,
          modelAccuracy: 1
        }
      };
      
      render(<ConfidenceScoreDisplay confidence={confidence} />);
      
      // Should show low confidence warning
      expect(screen.getByText(/Low Confidence Warning/i)).toBeInTheDocument();
    });
  });
  
  describe('Accessibility', () => {
    test('should have proper ARIA labels for progress bars', () => {
      const confidence: ConfidenceScore = {
        overall: 75,
        components: {
          weatherData: 80,
          imageAnalysis: 70,
          modelAccuracy: 75
        }
      };
      
      render(<ConfidenceScoreDisplay confidence={confidence} />);
      
      // Check for ARIA labels
      expect(screen.getByLabelText('Overall confidence score')).toBeInTheDocument();
      expect(screen.getByLabelText('Weather data confidence')).toBeInTheDocument();
      expect(screen.getByLabelText('Image analysis confidence')).toBeInTheDocument();
      expect(screen.getByLabelText('Model accuracy confidence')).toBeInTheDocument();
    });
  });
});
