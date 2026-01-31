
import { routeGeminiCall } from './gemini';

export async function processCropHealth(imageB64: string) {
  const prompt = `Act as a multi-agent system (AgriResolve AI) to assess this crop leaf image.

Follow these workflow stages:
1. VISION EVIDENCE: Extract low-level features (textures, colors, anomalies).
2. QUALITY EVALUATOR: Check for blur, lighting, background contamination. Assign a quality score 0-1.
3. HYPOTHESIS DEBATE:
   - Agent A (Healthy): Argue for benign explanations, discount weak anomalies.
   - Agent B (Disease): Highlight risks, elevate uncertainty.
4. ARBITRATION: Resolve the debate based on evidence quality and confidence. Verdicts: Likely Healthy, Possibly Healthy, Possibly Abnormal, Likely Abnormal, Indeterminate.
5. EXPLANATION: Provide a plain-language summary and farmer-safe guidance.

STRICT RULES:
- NO chemical or treatment prescriptions.
- Focus on risk assessment and monitoring guidance.
- Encourage expert consultation if abnormal.

Return the response as a structured JSON object.`;

  const text = await routeGeminiCall('GENERATE_JSON', prompt, imageB64);
  return JSON.parse(text);
}
