import { routeGeminiCall } from '../../../services/gemini';

export type CropCalendarEvent = {
    crop: string;
    stage: string;
    timing: string; // e.g. "Early Jan"
    notes: string;
};

export type DiseaseAlert = {
    id: string;
    disease: string;
    severity: 'High' | 'Medium' | 'Low';
    location: string;
    reportedCount: number;
    timestamp: number;
};

// Fallback data if API fails to ensure UI is never empty
const FALLBACK_CALENDAR: CropCalendarEvent[] = [
    { crop: "Rice (Rabi)", stage: "Growing", timing: "Jan - Mar", notes: "Monitor water levels; Watch for Stem Borer." },
    { crop: "Groundnut", stage: "Sowing/Growing", timing: "Dec - Feb", notes: "Ensure soil moisture; check for leaf spot." },
    { crop: "Chilli", stage: "Harvesting", timing: "Jan - Feb", notes: "Ideal picking time; dry properly." }
];

// In-memory map to deduplicate duplicate requests (e.g. React Strict Mode)
const activeRequests: Record<string, Promise<CropCalendarEvent[]> | undefined> = {};

export const fetchCropCalendar = async (location: string, language?: string): Promise<CropCalendarEvent[]> => {
    const lang = (language || 'en').toLowerCase();
    const month = new Date().toLocaleString(language || undefined, { month: 'long' });
    const cacheKey = `agri_calendar_${location}_${month}_${lang}`;

    // 1. Try Local Cache First
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            console.log(`[Insights] Serving cached calendar for ${location}`);
            return JSON.parse(cached);
        }
    } catch (_e) { /* Ignore */ }

    // 2. Check for existing in-flight request (Deduplication)
    if (activeRequests[cacheKey]) {
        console.log(`[Insights] Reusing active flight for ${location}`);
        return activeRequests[cacheKey];
    }

    const task = (async () => {
        const prompt = `
            You are an agricultural expert for ${location}.
            Current Month: ${month}.
            User language: ${lang}.
            IMPORTANT: Return crop, stage, timing, notes in the user's language. If the user language is not English, translate everything.
            
            Generate a JSON array of 3-5 key crops suitable for this specific region and season.
            If the specific village/town is unknown, provide data for the State or Region (e.g., Andhra Pradesh/Telangana context).
            
            Format:
            [
                { "crop": "Name", "stage": "Sowing/Growing/Harvesting", "timing": "Specific timing", "notes": "Brief tip" }
            ]
            
            Strict JSON only. No markdown.
        `;

        try {
            const jsonStr = await routeGeminiCall('GENERATE_JSON', prompt);
            const data = JSON.parse(jsonStr);
            const result = Array.isArray(data) && data.length > 0 ? data : FALLBACK_CALENDAR;

            // 3. Save to Cache
            localStorage.setItem(cacheKey, JSON.stringify(result));
            return result;

        } catch (e) {
            console.warn("Calendar Fetch Failed, using fallback", e);
            // Cache fallback too to prevent infinite retries on error
            localStorage.setItem(cacheKey, JSON.stringify(FALLBACK_CALENDAR));
            return FALLBACK_CALENDAR;
        } finally {
            // Cleanup active request
            delete activeRequests[cacheKey];
        }
    })();

    activeRequests[cacheKey] = task;
    return task;
};

export const fetchDiseaseAlerts = (location: string): DiseaseAlert[] => {
    // Mock simulation of community intelligence
    // Deterministic randomness based on date to keep it stable for the user session
    const seed = new Date().getDate();

    // Regional pests mapping (simplified)
    const commonPests = [
        "Pink Bollworm", "Leaf Spot", "Stem Borer", "Rust", "Aphids", "Whitefly"
    ];

    const alerts: DiseaseAlert[] = [];

    // Generate 2-3 mocks
    for (let i = 0; i < 3; i++) {
        alerts.push({
            id: `alert-${i}-${seed}`,
            disease: commonPests[(seed + i) % commonPests.length],
            severity: i === 0 ? 'High' : (i === 1 ? 'Medium' : 'Low'),
            location: location,
            reportedCount: 10 + (i * 5),
            timestamp: Date.now() - (i * 3600000) // Hours ago
        });
    }

    return alerts;
};
