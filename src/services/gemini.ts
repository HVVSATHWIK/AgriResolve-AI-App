import { GoogleGenAI } from "@google/genai";

const rawKey = import.meta.env.VITE_GEMINI_API_TOKEN ||
    (typeof process !== 'undefined' ? process.env?.VITE_GEMINI_API_TOKEN : undefined);

const API_KEY = rawKey ? rawKey.replace(/\s/g, '').trim() : "";

if (!API_KEY) {
    console.warn("Missing VITE_GEMINI_API_TOKEN in environment variables");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "" });

function toInlineImage(imageB64: string): { mimeType: string; data: string } {
    const match = imageB64.match(/^data:(image\/[^;]+);base64,(.*)$/);
    if (match) {
        return { mimeType: match[1], data: match[2] };
    }

    return {
        mimeType: 'image/jpeg',
        data: imageB64.split(',')[1] || imageB64,
    };
}

const SAFETY_SYSTEM_INSTRUCTION = `
You are AgriResolve AI, a cautious agricultural decision-support assistant.

Safety rules (highest priority):
- Do NOT provide instructions for making, mixing, concentrating, or dosing chemicals (pesticides/fungicides/herbicides), nor application rates, nor any step-by-step hazardous procedure.
- Do NOT give human/animal medical advice. If asked about poisoning/exposure, recommend contacting local emergency services/poison control and following the product label/SDS.
- If a request is unsafe or illegal, refuse briefly and offer safer alternatives (monitoring, sanitation, scouting, consult agronomist, follow local guidelines).

Output rules:
- Follow the user-provided format requirements (e.g., JSON) and language requirements in the prompt.
- Be conservative with certainty; call out uncertainty clearly.
`;

const DEFAULT_CONFIG = {
    temperature: 0.2,
    maxOutputTokens: 1400,
    // Library/API versions differ; keep these as plain strings for compatibility.
    safetySettings: [
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
};

// Model Registry
// - Avoid any 1.5 models (per request)
// - Provide a small set of >=2.x/2.5-ish fallbacks so we can hop if one model is
//   temporarily unavailable / rate-limited.
// NOTE: Availability varies by account/quota; we treat this as an ordered preference list.
const MODEL_FALLBACKS: Record<string, string[]> = {
    VISION_FAST: [
        'gemini-2.5-flash-lite',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
    ],
    DEBATE_HIGH_THROUGHPUT: [
        'gemini-2.5-flash-lite',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
    ],
    ARBITRATION_SMART: [
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite',
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
    ],
    EXPLANATION_POLISHED: [
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite',
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
    ],
    CHAT_INTERACTIVE: [
        'gemini-2.5-flash-lite',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
    ],
    GENERATE_JSON: [
        'gemini-2.5-flash-lite',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
    ],
};

export async function routeGeminiCall(
    taskType: keyof typeof MODEL_FALLBACKS,
    prompt: string,
    imageB64?: string
): Promise<string> {
    const modelCandidates = MODEL_FALLBACKS[taskType] ?? ['gemini-2.5-flash-lite'];
    const model = ai.models.generateContent;

    const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [{ text: prompt }];

    if (imageB64) {
        const inline = toInlineImage(imageB64);
        parts.push({
            inlineData: {
                mimeType: inline.mimeType,
                data: inline.data,
            },
        });
    }

    const MAX_RETRIES_PER_MODEL = 2;

    for (const modelName of modelCandidates) {
        console.log(`[Gemini Service] Routing '${taskType}' to model: ${modelName}`);

        let attempt = 0;
        while (attempt <= MAX_RETRIES_PER_MODEL) {
            try {
                const response = await model({
                    model: modelName,
                    contents: [{ parts }],
                    config: {
                        ...DEFAULT_CONFIG,
                        systemInstruction: { parts: [{ text: SAFETY_SYSTEM_INSTRUCTION }] },
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any,
                });

                const text = response.text || '';

                // For JSON tasks, strip markdown code blocks if present
                if (taskType === 'GENERATE_JSON') {
                    return text.replace(/```json\n?|\n?```/g, '').trim();
                }

                return text;
            } catch (error: unknown) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const err = error as any;
                attempt++;

                const status = err?.status ?? err?.code;
                const message: string = String(err?.message ?? '');

                // Model selection errors -> try next model.
                const isModelNotFound = status === 404;
                const isModelInvalid = status === 400 && /model/i.test(message) && /not found|invalid/i.test(message);

                // Quota/server errors -> retry (backoff) then, if still failing, fall through to next model.
                const isRateLimit = status === 429 || message.includes('429');
                const isServerError = status === 500 || status === 502 || status === 503 || status === 504;

                // Auth / key issues -> don't rotate models; prompt user to fix key.
                const isAuthError = status === 401 || status === 403;
                const isInvalidKey = (status === 400 || status === 403) && /API key/i.test(message);

                if (isInvalidKey || isAuthError) {
                    console.error(`Gemini API auth error (${taskType}) using ${modelName}:`, error);
                    throw new Error('Gemini API key is invalid/missing or not authorized. Set VITE_GEMINI_API_TOKEN to a valid key.');
                }

                if (isModelNotFound || isModelInvalid) {
                    console.warn(`Model ${modelName} unavailable (${status}). Trying next model...`);
                    break;
                }

                if ((isRateLimit || isServerError) && attempt <= MAX_RETRIES_PER_MODEL) {
                    const delay = 1500 * Math.pow(2, attempt - 1); // 1.5s, 3s
                    console.warn(
                        `Gemini transient error (${status ?? 'unknown'}) for ${modelName}. Retrying in ${delay}ms... (Attempt ${attempt}/${MAX_RETRIES_PER_MODEL})`
                    );
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }

                // Non-retryable error -> try next model.
                console.warn(`Gemini API error for ${modelName} (${taskType}); trying next model...`, error);
                break;
            }
        }
    }

    throw new Error(
        `All Gemini fallback models failed for task '${taskType}'. Check your API key/quota and model availability.`
    );
}
