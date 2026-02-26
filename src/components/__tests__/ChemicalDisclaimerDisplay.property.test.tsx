/**
 * @jest-environment jsdom
 */

/**
 * Property-Based Tests for ChemicalDisclaimerDisplay Component
 * 
 * Tests universal properties across randomized inputs.
 * 
 * Feature: agricultural-accuracy-and-security-fixes
 * 
 * Requirements:
 * - 10.1: Display disclaimer that database is incomplete
 * - 10.2: Show recommendation to consult local agricultural extension
 * - 10.4: Display warning when restricted chemical is detected
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { ChemicalDisclaimerDisplay, DetectedChemical, RestrictionLevel } from '../ChemicalDisclaimerDisplay';

describe('ChemicalDisclaimerDisplay - Property Tests', () => {
  /**
   * Property 25: Chemical database disclaimer display
   * 
   * For any page or component displaying chemical recommendations, the system should 
   * show a disclaimer that the database is incomplete and recommend consulting local 
   * agricultural extension offices.
   * 
   * Validates: Requirements 10.1, 10.2
   */
  test('Property 25: Chemical database disclaimer display', () => {
    // Arbitrary for restriction levels
    const restrictionLevelArb = fc.constantFrom<RestrictionLevel>('banned', 'restricted', 'caution');
    
    // Arbitrary for detected chemicals
    const detectedChemicalArb = fc.record({
      name: fc.string({ minLength: 3, maxLength: 30 }),
      variations: fc.array(fc.string({ minLength: 3, maxLength: 30 }), { minLength: 1, maxLength: 5 }),
      restrictionLevel: restrictionLevelArb,
      recommendation: fc.string({ minLength: 10, maxLength: 200 })
    });
    
    // Test with random arrays of detected chemicals
    fc.assert(
      fc.property(
        fc.array(detectedChemicalArb, { minLength: 0, maxLength: 10 }),
        (chemicals) => {
          const { container } = render(
            <ChemicalDisclaimerDisplay 
              detectedChemicals={chemicals} 
              showAlways={true} 
            />
          );
          
          // Requirement 10.1: Should always show disclaimer that database is incomplete
          const disclaimerText = container.textContent || '';
          expect(disclaimerText).toMatch(/chemical restriction database is incomplete/i);
          expect(disclaimerText).toMatch(/incomplete/i);
          
          // Requirement 10.2: Should always recommend consulting local agricultural extension
          expect(disclaimerText).toMatch(/agricultural extension/i);
          expect(disclaimerText).toMatch(/consult/i);
          
          // Should show safety reminder
          expect(disclaimerText).toMatch(/safety reminder/i);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 26: Restricted chemical warning
   * 
   * For any detected restricted chemical in user input or recommendations, the system 
   * should display a warning along with the chemical database disclaimer.
   * 
   * Validates: Requirements 10.4
   */
  test('Property 26: Restricted chemical warning', () => {
    // Arbitrary for restriction levels
    const restrictionLevelArb = fc.constantFrom<RestrictionLevel>('banned', 'restricted', 'caution');
    
    // Arbitrary for detected chemicals
    const detectedChemicalArb = fc.record({
      name: fc.string({ minLength: 3, maxLength: 30 }).filter(s => s.trim().length > 0),
      variations: fc.array(fc.string({ minLength: 3, maxLength: 30 }), { minLength: 1, maxLength: 5 }),
      restrictionLevel: restrictionLevelArb,
      recommendation: fc.string({ minLength: 10, maxLength: 200 }).filter(s => s.trim().length > 0)
    });
    
    // Test with at least one detected chemical
    fc.assert(
      fc.property(
        fc.array(detectedChemicalArb, { minLength: 1, maxLength: 10 }),
        (chemicals) => {
          const { container } = render(
            <ChemicalDisclaimerDisplay detectedChemicals={chemicals} />
          );
          
          const content = container.textContent || '';
          
          // Requirement 10.4: Should display warning for each detected chemical
          chemicals.forEach(chemical => {
            // Should show chemical name
            expect(content).toContain(chemical.name);
            
            // Should show restriction level
            expect(content.toLowerCase()).toContain(chemical.restrictionLevel.toLowerCase());
            
            // Should show recommendation
            expect(content).toContain(chemical.recommendation);
          });
          
          // Should also show the database disclaimer
          expect(content).toMatch(/chemical restriction database is incomplete/i);
          expect(content).toMatch(/agricultural extension/i);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional Property: Consistent styling for restriction levels
   * 
   * For any restriction level, the component should apply consistent styling
   * that matches the severity of the restriction.
   */
  test('Property: Consistent styling for restriction levels', () => {
    const restrictionLevelArb = fc.constantFrom<RestrictionLevel>('banned', 'restricted', 'caution');
    
    fc.assert(
      fc.property(
        restrictionLevelArb,
        fc.string({ minLength: 3, maxLength: 30 }),
        fc.string({ minLength: 10, maxLength: 200 }),
        (level, name, recommendation) => {
          const chemical: DetectedChemical = {
            name,
            variations: [name],
            restrictionLevel: level,
            recommendation
          };
          
          const { container } = render(
            <ChemicalDisclaimerDisplay detectedChemicals={[chemical]} />
          );
          
          const warningDiv = container.querySelector('.chemical-warning');
          expect(warningDiv).toBeTruthy();
          
          // Check that appropriate styling is applied based on level
          if (level === 'banned') {
            expect(warningDiv).toHaveClass('bg-red-50', 'border-red-300');
          } else if (level === 'restricted') {
            expect(warningDiv).toHaveClass('bg-orange-50', 'border-orange-300');
          } else if (level === 'caution') {
            expect(warningDiv).toHaveClass('bg-yellow-50', 'border-yellow-300');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional Property: Variations display
   * 
   * For any chemical with multiple variations, the component should display
   * the "Also known as" section with all variations except the primary name.
   */
  test('Property: Variations display for chemicals with multiple names', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 30 }),
        fc.array(fc.string({ minLength: 3, maxLength: 30 }), { minLength: 2, maxLength: 5 }),
        fc.constantFrom<RestrictionLevel>('banned', 'restricted', 'caution'),
        fc.string({ minLength: 10, maxLength: 200 }),
        (name, variations, level, recommendation) => {
          // Ensure the primary name is in variations
          const allVariations = [name, ...variations];
          
          const chemical: DetectedChemical = {
            name,
            variations: allVariations,
            restrictionLevel: level,
            recommendation
          };
          
          const { container } = render(
            <ChemicalDisclaimerDisplay detectedChemicals={[chemical]} />
          );
          
          const content = container.textContent || '';
          
          // Should show "Also known as" when there are multiple variations
          if (allVariations.length > 1) {
            expect(content).toMatch(/Also known as:/i);
            
            // Should show all variations except the first one
            allVariations.slice(1).forEach(variation => {
              expect(content).toContain(variation);
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional Property: No display without chemicals when showAlways is false
   * 
   * For any case where no chemicals are detected and showAlways is false,
   * the component should not render anything.
   */
  test('Property: No display without chemicals when showAlways is false', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (showAlways) => {
          const { container } = render(
            <ChemicalDisclaimerDisplay 
              detectedChemicals={[]} 
              showAlways={showAlways} 
            />
          );
          
          if (!showAlways) {
            // Should not render anything
            expect(container.firstChild).toBeNull();
          } else {
            // Should render disclaimer
            expect(container.firstChild).not.toBeNull();
            const content = container.textContent || '';
            expect(content).toMatch(/chemical restriction database is incomplete/i);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional Property: All detected chemicals are displayed
   * 
   * For any array of detected chemicals, all chemicals should be displayed
   * in the component output.
   */
  test('Property: All detected chemicals are displayed', () => {
    const detectedChemicalArb = fc.record({
      name: fc.string({ minLength: 3, maxLength: 30 }).filter(s => s.trim().length > 0),
      variations: fc.array(fc.string({ minLength: 3, maxLength: 30 }), { minLength: 1, maxLength: 5 }),
      restrictionLevel: fc.constantFrom<RestrictionLevel>('banned', 'restricted', 'caution'),
      recommendation: fc.string({ minLength: 10, maxLength: 200 }).filter(s => s.trim().length > 0)
    });
    
    fc.assert(
      fc.property(
        fc.array(detectedChemicalArb, { minLength: 1, maxLength: 10 }),
        (chemicals) => {
          const { container } = render(
            <ChemicalDisclaimerDisplay detectedChemicals={chemicals} />
          );
          
          const content = container.textContent || '';
          
          // Every chemical should be displayed
          chemicals.forEach(chemical => {
            expect(content).toContain(chemical.name);
            expect(content.toLowerCase()).toContain(chemical.restrictionLevel.toLowerCase());
          });
          
          // The count of chemical warnings should match the input
          const warningDivs = container.querySelectorAll('.chemical-warning');
          expect(warningDivs.length).toBe(chemicals.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
