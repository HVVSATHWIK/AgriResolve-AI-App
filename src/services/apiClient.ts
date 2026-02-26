/**
 * API Client — Backend Proxy
 * 
 * All Gemini API calls are proxied through the backend server.
 * The backend holds the API key; the client never touches it.
 * Feature: security-and-architecture-compliance
 */

/**
 * API response structure (kept compatible with existing frontend code)
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  result: T;
  timestamp: string;
}

/**
 * Analysis request parameters
 */
export interface AnalysisRequest {
  taskType: 'VISION_FAST' | 'GENERATE_JSON' | 'CHAT_INTERACTIVE';
  prompt: string;
  image?: string;
  manualWeather?: {
    temperature: number | null;
    humidity: number | null;
    windSpeed: number | null;
  };
}

/**
 * Resolve the backend API base URL.
 * In production → VITE_API_URL (e.g. https://agriresolve-backend.onrender.com)
 * In development → empty string (Vite proxy or same-origin)
 */
const API_BASE = import.meta.env.VITE_API_URL ?? '';

/**
 * Call Gemini API via Backend Proxy
 */
export async function callAnalysisAPI<T = unknown>(
  request: AnalysisRequest
): Promise<ApiResponse<T>> {

  try {
    console.log(`[API Client] Sending ${request.taskType} request to backend at ${API_BASE}/api/analysis ...`);

    const response = await fetch(`${API_BASE}/api/analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        taskType: request.taskType,
        prompt: request.prompt,
        image: request.image,
        weatherData: request.manualWeather
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Backend error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      result: data.data || data.result || data,
      timestamp: new Date().toISOString()
    };

  } catch (error: any) {
    console.error('[API Client] Backend request failed:', error);
    throw error;
  }
}

/**
 * Health check against the backend
 */
export async function checkAPIHealth(): Promise<{ status: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    return await res.json();
  } catch {
    return { status: 'unhealthy' };
  }
}

export async function checkServiceHealth(service: string): Promise<{ service: string; available: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/health/${service}`);
    return await res.json();
  } catch {
    return { service, available: false, message: 'Health check failed' };
  }
}
