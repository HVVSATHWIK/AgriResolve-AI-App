/**
 * Gemini Service - Backend Proxy Integration
 * 
 * Updated to use backend API proxy instead of direct Gemini API calls
 * Feature: agricultural-accuracy-and-security-fixes
 * Requirements: 5.1, 5.2
 */

import { callAnalysisAPI, type ApiResponse } from './apiClient';

/**
 * Process crop health analysis through backend proxy
 * Requirement 5.1: Use backend proxy for all Gemini API calls
 * Requirement 5.2: Never expose API keys in frontend
 */
export async function processCropHealth(imageB64: string): Promise<ApiResponse> {
  const prompt = `Act as a multi-agent system (AgriResolve AI) to assess this crop leaf image.

Follow these workflow stages:
1. VISION EVIDENCE: Extract low-level features (textures, colors, anomalies).
2. QUALITY EVALUATOR: Check for blur, lighting, background contamination. Assign a quality score 0-1.
3. HYPOTHESIS DEBATE:
   - Agent A (Healthy): Argue for benign explanations, discount weak anomalies.
   - Agent B (Disease): Highlight risks, elevate uncertainty.
4. SOIL INTELLIGENCE: Analyze the background soil (if visible). Detect texture (Sandy/Clay/Loamy), moisture cues, and color.
5. ARBITRATION: Resolve the debate based on evidence quality and confidence. Verdicts: Likely Healthy, Possibly Healthy, Possibly Abnormal, Likely Abnormal, Indeterminate.
6. EXPLANATION: Provide a plain-language summary and farmer-safe guidance. Include a "Soil Insights" section if soil was analyzed.

STRICT RULES:
- NO chemical or treatment prescriptions.
- Focus on risk assessment and monitoring guidance.
- Encourage expert consultation if abnormal.

Return the response as a structured JSON object.`;

  const response = await callAnalysisAPI({
    taskType: 'GENERATE_JSON',
    prompt,
    image: imageB64,
  });

  // Parse the result if it's a string
  if (typeof response.result === 'string') {
    try {
      response.result = JSON.parse(response.result);
    } catch (e) {
      // If parsing fails, return as-is
      console.warn('Failed to parse analysis result as JSON:', e);
    }
  }

  return response;
}
