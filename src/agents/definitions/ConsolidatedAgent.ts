import { routeGeminiCall } from '../../services/gemini';
import { AssessmentData } from '../../types';

export class ConsolidatedAgent {
    async run(imageB64: string, language: string = 'en'): Promise<AssessmentData> {
        const prompt = `
            You are the Consolidated Agricultural Intelligence (CAI), a highly advanced diagnostic engine.
            Your goal is to replace a team of 5 specialized agents (Vision, Quality, Healthy-Hypothesis, Disease-Hypothesis, Arbitrator) by performing all their tasks in a SINGLE cognitive pass.

            CONTEXT:
            - User Language: ${language} (Translate ONLY the user-facing text: 'findings', 'arguments', 'decision', 'rationale', 'summary', 'guidance'. Keep keys and 'id's in English).
            - Task: Analyze the image of a crop/plant.
            
            INTERNAL PROCESS (Do this implicitly):
            1. VISION: Scan for lesions, discoloration, pest damage.
            2. QUALITY: Rate image clarity (0.0-1.0). If < 0.4, reject.
            3. DEBATE: 
               - Dr. Green (Pathologist) argues for specific diseases.
               - Field Agent (Agronomist) argues for healthy/abiotic factors.
            4. VERDICT: Weigh evidence and decide.
            
            OUTPUT SCHEMA (Strict JSON):
            {
              "visionEvidence": {
                "findings": ["...localized observation 1...", "...observation 2..."],
                "regions": ["leaf_tip", "stem", "veins"]
              },
              "quality": {
                "score": 0.95, 
                "issues": [] 
              },
              "healthyResult": {
                "score": 0.2,
                "is_healthy": false,
                "arguments": ["...argument 1...", "...argument 2..."],
                "evidence_refs": {"quality_score": 0.95}
              },
              "diseaseResult": {
                "score": 0.8,
                "arguments": ["...argument 1...", "...argument 2..."],
                "evidence_refs": {"quality_score": 0.95}
              },
              "arbitrationResult": {
                "decision": "Display Name of Disease or 'Healthy'",
                "confidence": 0.85,
                "rationale": ["...summary of the internal debate...", "...key deciding factor..."],
                "final_diagnosis": "Disease_Name_Or_Healthy"
              },
              "explanation": {
                "summary": "Farmer-friendly summary of the situation.",
                "guidance": ["Step 1...", "Step 2..."]
              }
            }

            CRITICAL RULES:
            - Output ONLY raw JSON. No markdown blocks.
            - If language is NOT 'en', translate the values in 'findings', 'arguments', 'decision', 'rationale', 'summary', 'guidance'.
            - Ensure 'decision' is short (e.g., "Early Blight", "Healthy").
            - 'final_diagnosis' should be a standard English identifier (e.g., "early_blight", "healthy").
        `;

        try {
            // Using 'DEBATE_HIGH_THROUGHPUT' model (gemini-2.0-flash-lite) for this heavy lifting
            const responseText = await routeGeminiCall('DEBATE_HIGH_THROUGHPUT', prompt, imageB64);
            const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(cleanJson);

            // Backfill potentially missing fields to ensure UI safety
            return {
                imageUrl: null,
                visionEvidence: data.visionEvidence || { findings: [], regions: [] },
                quality: data.quality || { score: 1, issues: [] },
                healthyResult: data.healthyResult || { score: 0, is_healthy: false, arguments: [] },
                diseaseResult: data.diseaseResult || { score: 0, arguments: [] },
                arbitrationResult: data.arbitrationResult || { decision: "Unknown", confidence: 0, rationale: [] },
                explanation: data.explanation || { summary: "Analysis failed.", guidance: [] }
            };
        } catch (error) {
            console.error("Consolidated Agent Error:", error);
            throw new Error("Failed to generate assessment.");
        }
    }
}
