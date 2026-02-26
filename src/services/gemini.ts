/**
 * Gemini API Integration
 * 
 * Simplified: Direct Client-Side API calls
 * 
 * Feature: client-side-simplicity
 */

import { callAnalysisAPI } from './apiClient';

// API key should be in VITE_GEMINI_API_KEY
const rawKey = import.meta.env.VITE_GEMINI_API_KEY;

if (rawKey) {
    console.log(
        '[Gemini Service] Client-Side Mode Active.'
    );
}

// Model Registry - kept for type compatibility
const MODEL_FALLBACKS = {
    VISION_FAST: 'VISION_FAST',
    DEBATE_HIGH_THROUGHPUT: 'GENERATE_JSON',
    ARBITRATION_SMART: 'GENERATE_JSON',
    EXPLANATION_POLISHED: 'GENERATE_JSON',
    CHAT_INTERACTIVE: 'CHAT_INTERACTIVE',
    GENERATE_JSON: 'GENERATE_JSON',
} as const;

/**
 * Route Gemini call directly from client
 */
export async function routeGeminiCall(
    taskType: keyof typeof MODEL_FALLBACKS,
    prompt: string,
    imageB64?: string
): Promise<string> {
    console.log(`[Gemini Service] Routing '${taskType}' via Client-Side API`);

    try {
        // Map old task types to new ones
        const mappedTaskType = MODEL_FALLBACKS[taskType] as 'VISION_FAST' | 'GENERATE_JSON' | 'CHAT_INTERACTIVE';

        // Call backend proxy
        const response = await callAnalysisAPI({
            taskType: mappedTaskType,
            prompt,
            image: imageB64,
        });

        // Log degradation warnings if present
        // Log degradation warnings if present (not supported in simple client)
        /*
        if (response.degraded && response.limitations) {
            console.warn('[Gemini Service] Service degradation detected:', response.limitations);
        }
        */

        // Return result as string (for backward compatibility)
        if (typeof response.result === 'string') {
            return response.result;
        }

        // If result is an object, stringify it
        return JSON.stringify(response.result);
    } catch (error) {
        console.error(`[Gemini Service] Backend proxy call failed for '${taskType}':`, error);
        throw error;
    }
}
