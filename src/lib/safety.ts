export type SafetyBlockReason =
    | 'chemical_dosing'
    | 'self_harm'
    | 'weapons'
    | 'medical';

export interface SafetyBlockResult {
    blocked: boolean;
    reason?: SafetyBlockReason;
}

const patterns: Array<{ reason: SafetyBlockReason; regex: RegExp }> = [
    // Chemical dosing / mixing / concentration requests
    {
        reason: 'chemical_dosing',
        regex: /\b(dose|dosage|how\s*much|ml\b|litre|liter|grams?|g\b|ppm|ratio|mix|dilute|concentrat(e|ion)|spray\s*rate|per\s*(acre|hectare|ha)|tank\s*mix)\b[\s\S]*\b(pesticide|insecticide|fungicide|herbicide|chemical|chlorpyrifos|imidacloprid|mancozeb|carbendazim|glyphosate|urea|ammonia)\b/i,
    },

    // Self-harm
    {
        reason: 'self_harm',
        regex: /\b(suicide|kill\s*myself|self[-\s]*harm|end\s*my\s*life)\b/i,
    },

    // Weapons/explosives
    {
        reason: 'weapons',
        regex: /\b(build|make)\b[\s\S]*\b(bomb|explosive|gun|firearm|weapon)\b/i,
    },

    // Human/animal medical advice (keep broad but not overly aggressive)
    {
        reason: 'medical',
        regex: /\b(poison(ed|ing)?|toxic|ingest(ed|ion)?|inhal(ed|ation)?|skin\s*burn|eye\s*exposure|antidote|treatment\s*for)\b/i,
    },
];

export function checkUserSafety(text: string): SafetyBlockResult {
    const normalized = text.trim();
    if (!normalized) return { blocked: false };

    for (const { reason, regex } of patterns) {
        if (regex.test(normalized)) {
            return { blocked: true, reason };
        }
    }

    return { blocked: false };
}
