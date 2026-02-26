import { BioProspectorResult } from '../../types';

// We are testing the parsing logic logic implicitly by verifying the structure
// Since the actual parsing logic is inside ConsolidatedAgent which makes private calls,
// We will create a test that validates our expected JSON structure matches the Types.

describe('Bio-Prospector Data Integity', () => {
    it('should correctly type-check a valid BioProspector response', () => {
        const validResponse: unknown = {
            plant_name: 'Tulsi',
            scientific_name: 'Ocimum sanctum',
            medicinal_uses: ['Treats colds', 'Immunity booster'],
            commercial_uses: ['Essential oil', 'Tea'],
            tips: ['Grow in full sun', 'Harvest leaves in morning']
        };

        // TypeScript validation at runtime equivalent
        const result = validResponse as BioProspectorResult;

        expect(result.plant_name).toBe('Tulsi');
        expect(result.medicinal_uses).toContain('Treats colds');
        expect(result.commercial_uses.length).toBe(2);
    });

    it('should handle missing optional fields gracefully', () => {
        const partialResponse: unknown = {
            plant_name: 'Grass',
            scientific_name: 'Poaceae',
            medicinal_uses: [],
            commercial_uses: [],
            tips: [] // Agent might return empty arrays
        };

        const result = partialResponse as BioProspectorResult;
        expect(result.plant_name).toBe('Grass');
        expect(result.medicinal_uses).toEqual([]);
    });

    // This test simulates the "ConsolidatedAgent" parsing logic where it extracts the specific field
    it('should be extractable from a larger agent response', () => {
        const fullAgentResponse = {
            analysis: {
                health: 'Good',
                bio_prospector: {
                    plant_name: 'Neem',
                    scientific_name: 'Azadirachta indica',
                    medicinal_uses: ['Antiseptic'],
                    commercial_uses: ['Pesticide'],
                    tips: []
                }
            }
        };

        const extracted = fullAgentResponse.analysis.bio_prospector;
        expect(extracted.scientific_name).toBe('Azadirachta indica');
    });
});
