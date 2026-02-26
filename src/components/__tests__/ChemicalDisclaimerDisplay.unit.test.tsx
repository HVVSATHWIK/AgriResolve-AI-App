/**
 * @jest-environment jsdom
 */

/**
 * Unit Tests for ChemicalDisclaimerDisplay Component
 * 
 * Tests specific examples and edge cases for chemical disclaimer display.
 * 
 * Requirements:
 * - 10.1: Display disclaimer that database is incomplete
 * - 10.2: Show recommendation to consult local agricultural extension
 * - 10.4: Display warning when restricted chemical is detected
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChemicalDisclaimerDisplay, DetectedChemical } from '../ChemicalDisclaimerDisplay';

describe('ChemicalDisclaimerDisplay - Unit Tests', () => {
  describe('Disclaimer Display - Requirements 10.1, 10.2', () => {
    test('should display database disclaimer when showAlways is true', () => {
      render(<ChemicalDisclaimerDisplay showAlways={true} />);
      
      // Requirement 10.1: Database is incomplete
      expect(screen.getByText(/chemical restriction database is incomplete/i)).toBeInTheDocument();
      
      // Requirement 10.2: Consult local agricultural extension
      expect(screen.getByText(/always consult your local agricultural extension office/i)).toBeInTheDocument();
    });

    test('should not display when no chemicals detected and showAlways is false', () => {
      const { container } = render(<ChemicalDisclaimerDisplay showAlways={false} />);
      
      expect(container.firstChild).toBeNull();
    });

    test('should display disclaimer with detected chemicals', () => {
      const chemicals: DetectedChemical[] = [{
        name: 'paraquat',
        variations: ['paraquat', 'gramoxone'],
        restrictionLevel: 'banned',
        recommendation: 'This chemical is banned in many regions.'
      }];
      
      render(<ChemicalDisclaimerDisplay detectedChemicals={chemicals} />);
      
      // Should show disclaimer
      expect(screen.getByText(/chemical restriction database is incomplete/i)).toBeInTheDocument();
      expect(screen.getByText(/always consult your local agricultural extension office/i)).toBeInTheDocument();
    });
  });

  describe('Restricted Chemical Warnings - Requirement 10.4', () => {
    test('should display warning for banned chemical', () => {
      const chemicals: DetectedChemical[] = [{
        name: 'paraquat',
        variations: ['paraquat', 'gramoxone'],
        restrictionLevel: 'banned',
        recommendation: 'This chemical is banned in many regions. Consult local authorities before use.'
      }];
      
      render(<ChemicalDisclaimerDisplay detectedChemicals={chemicals} />);
      
      // Should show chemical name
      expect(screen.getByText('paraquat')).toBeInTheDocument();
      
      // Should show restriction level badge
      expect(screen.getByText('banned')).toBeInTheDocument();
      
      // Should show specific recommendation
      expect(screen.getByText(/This chemical is banned in many regions/i)).toBeInTheDocument();
      
      // Should show variations
      expect(screen.getByText(/Also known as: gramoxone/i)).toBeInTheDocument();
    });

    test('should display warning for restricted chemical', () => {
      const chemicals: DetectedChemical[] = [{
        name: 'chlorpyrifos',
        variations: ['chlorpyrifos', 'dursban', 'lorsban'],
        restrictionLevel: 'restricted',
        recommendation: 'This chemical has restrictions in many regions. Verify local regulations before use.'
      }];
      
      render(<ChemicalDisclaimerDisplay detectedChemicals={chemicals} />);
      
      // Should show chemical name
      expect(screen.getByText('chlorpyrifos')).toBeInTheDocument();
      
      // Should show restriction level badge
      expect(screen.getByText('restricted')).toBeInTheDocument();
      
      // Should show specific recommendation
      expect(screen.getByText(/This chemical has restrictions in many regions/i)).toBeInTheDocument();
      
      // Should show variations
      expect(screen.getByText(/Also known as: dursban, lorsban/i)).toBeInTheDocument();
    });

    test('should display warning for caution-level chemical', () => {
      const chemicals: DetectedChemical[] = [{
        name: 'glyphosate',
        variations: ['glyphosate', 'roundup'],
        restrictionLevel: 'caution',
        recommendation: 'This chemical is under review in many regions. Follow label instructions carefully.'
      }];
      
      render(<ChemicalDisclaimerDisplay detectedChemicals={chemicals} />);
      
      // Should show chemical name
      expect(screen.getByText('glyphosate')).toBeInTheDocument();
      
      // Should show restriction level badge
      expect(screen.getByText('caution')).toBeInTheDocument();
      
      // Should show specific recommendation
      expect(screen.getByText(/This chemical is under review in many regions/i)).toBeInTheDocument();
    });

    test('should display multiple restricted chemicals', () => {
      const chemicals: DetectedChemical[] = [
        {
          name: 'paraquat',
          variations: ['paraquat', 'gramoxone'],
          restrictionLevel: 'banned',
          recommendation: 'This chemical is banned in many regions.'
        },
        {
          name: 'chlorpyrifos',
          variations: ['chlorpyrifos', 'dursban'],
          restrictionLevel: 'restricted',
          recommendation: 'This chemical has restrictions in many regions.'
        }
      ];
      
      render(<ChemicalDisclaimerDisplay detectedChemicals={chemicals} />);
      
      // Should show both chemicals
      expect(screen.getByText('paraquat')).toBeInTheDocument();
      expect(screen.getByText('chlorpyrifos')).toBeInTheDocument();
      
      // Should show both restriction levels
      expect(screen.getByText('banned')).toBeInTheDocument();
      expect(screen.getByText('restricted')).toBeInTheDocument();
      
      // Should show both recommendations
      expect(screen.getByText(/This chemical is banned in many regions/i)).toBeInTheDocument();
      expect(screen.getByText(/This chemical has restrictions in many regions/i)).toBeInTheDocument();
    });

    test('should display chemical with single variation (no "Also known as")', () => {
      const chemicals: DetectedChemical[] = [{
        name: 'ddt',
        variations: ['ddt'],
        restrictionLevel: 'banned',
        recommendation: 'This chemical is banned internationally.'
      }];
      
      render(<ChemicalDisclaimerDisplay detectedChemicals={chemicals} />);
      
      // Should show chemical name
      expect(screen.getByText('ddt')).toBeInTheDocument();
      
      // Should NOT show "Also known as" when only one variation
      expect(screen.queryByText(/Also known as:/i)).not.toBeInTheDocument();
    });
  });

  describe('Styling and Accessibility', () => {
    test('should apply correct styling for banned chemicals', () => {
      const chemicals: DetectedChemical[] = [{
        name: 'paraquat',
        variations: ['paraquat'],
        restrictionLevel: 'banned',
        recommendation: 'Banned chemical.'
      }];
      
      const { container } = render(<ChemicalDisclaimerDisplay detectedChemicals={chemicals} />);
      
      // Check for red styling (banned)
      const warningDiv = container.querySelector('.chemical-warning');
      expect(warningDiv).toHaveClass('bg-red-50', 'border-red-300');
    });

    test('should apply correct styling for restricted chemicals', () => {
      const chemicals: DetectedChemical[] = [{
        name: 'chlorpyrifos',
        variations: ['chlorpyrifos'],
        restrictionLevel: 'restricted',
        recommendation: 'Restricted chemical.'
      }];
      
      const { container } = render(<ChemicalDisclaimerDisplay detectedChemicals={chemicals} />);
      
      // Check for orange styling (restricted)
      const warningDiv = container.querySelector('.chemical-warning');
      expect(warningDiv).toHaveClass('bg-orange-50', 'border-orange-300');
    });

    test('should apply correct styling for caution chemicals', () => {
      const chemicals: DetectedChemical[] = [{
        name: 'glyphosate',
        variations: ['glyphosate'],
        restrictionLevel: 'caution',
        recommendation: 'Use with caution.'
      }];
      
      const { container } = render(<ChemicalDisclaimerDisplay detectedChemicals={chemicals} />);
      
      // Check for yellow styling (caution)
      const warningDiv = container.querySelector('.chemical-warning');
      expect(warningDiv).toHaveClass('bg-yellow-50', 'border-yellow-300');
    });

    test('should have proper ARIA labels for restriction level badges', () => {
      const chemicals: DetectedChemical[] = [{
        name: 'paraquat',
        variations: ['paraquat'],
        restrictionLevel: 'banned',
        recommendation: 'Banned chemical.'
      }];
      
      render(<ChemicalDisclaimerDisplay detectedChemicals={chemicals} />);
      
      const badge = screen.getByRole('status', { name: /restriction level: banned/i });
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty detectedChemicals array with showAlways=true', () => {
      render(<ChemicalDisclaimerDisplay detectedChemicals={[]} showAlways={true} />);
      
      // Should show disclaimer
      expect(screen.getByText(/chemical restriction database is incomplete/i)).toBeInTheDocument();
      
      // Should NOT show "Detected Restricted Chemicals" section
      expect(screen.queryByText(/Detected Restricted Chemicals:/i)).not.toBeInTheDocument();
    });

    test('should handle undefined detectedChemicals with showAlways=true', () => {
      render(<ChemicalDisclaimerDisplay showAlways={true} />);
      
      // Should show disclaimer
      expect(screen.getByText(/chemical restriction database is incomplete/i)).toBeInTheDocument();
      
      // Should NOT show "Detected Restricted Chemicals" section
      expect(screen.queryByText(/Detected Restricted Chemicals:/i)).not.toBeInTheDocument();
    });

    test('should display safety reminder in all cases', () => {
      const chemicals: DetectedChemical[] = [{
        name: 'paraquat',
        variations: ['paraquat'],
        restrictionLevel: 'banned',
        recommendation: 'Banned chemical.'
      }];
      
      render(<ChemicalDisclaimerDisplay detectedChemicals={chemicals} />);
      
      expect(screen.getByText(/Safety Reminder:/i)).toBeInTheDocument();
      expect(screen.getByText(/Chemical regulations and restrictions vary by country/i)).toBeInTheDocument();
    });
  });
});
