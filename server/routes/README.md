# API Routes

## Analysis Endpoint

### Overview

The analysis endpoint provides a secure proxy for Gemini AI API calls. This endpoint ensures that API keys are never exposed to the client and all requests are properly validated and sanitized.

**Requirements Implemented:**
- 5.1: Backend server proxies all Gemini API requests
- 5.2: API keys are never exposed in client-side code or network traffic
- 5.3: Requests are validated before forwarding to Gemini API
- 5.4: API credentials are injected server-side
- 5.5: Responses are sanitized before returning to client

### Endpoints

#### POST /api/analysis

Processes AI analysis requests through the Gemini API proxy.

**Request Body:**
```json
{
  "taskType": "VISION_FAST" | "GENERATE_JSON" | "CHAT_INTERACTIVE",
  "prompt": "string (required)",
  "image": "string (optional, base64 encoded)"
}
```

**Response:**
```json
{
  "success": true,
  "result": "string (AI response)",
  "rateLimitInfo": {
    "quotaRemaining": 19,
    "quotaUsed": 1,
    "resetTime": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**

400 Bad Request - Invalid request parameters:
```json
{
  "error": "Invalid Request",
  "code": "VALIDATION_ERROR",
  "message": "taskType and prompt are required fields",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

429 Too Many Requests - Rate limit exceeded:
```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Maximum 20 requests per hour. Please try again later.",
  "retryAfter": 3600,
  "quotaRemaining": 0,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

500 Internal Server Error - Service configuration or processing error:
```json
{
  "error": "Analysis Failed",
  "code": "ANALYSIS_ERROR",
  "message": "Failed to process analysis request. Please try again later.",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### GET /api/analysis/health

Health check endpoint for the Gemini API proxy service.

**Response (Healthy):**
```json
{
  "status": "healthy",
  "message": "Gemini API proxy is operational",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Response (Unhealthy):**
```json
{
  "status": "unhealthy",
  "message": "Gemini API key not configured",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Security Features

1. **API Key Protection**
   - API keys are stored server-side only in `GEMINI_API_KEY` environment variable
   - Keys are never exposed in client-side code or network traffic
   - Keys are sanitized (whitespace removed) before use

2. **Request Validation**
   - All requests are validated before forwarding to Gemini API
   - Required fields: `taskType`, `prompt`
   - Task type must be one of the supported types
   - Invalid requests are rejected with 400 status

3. **Response Sanitization**
   - All responses are scanned for sensitive data patterns
   - API key patterns (e.g., `AIza...`) are detected and blocked
   - Environment variable references are removed
   - Bearer tokens are sanitized
   - Sensitive field names (apikey, secret, token, etc.) are redacted

4. **Rate Limiting**
   - Integrated with session-based rate limiting middleware
   - 5 requests per 10 minutes (short-term)
   - 20 requests per hour (long-term)
   - Rate limit info included in all responses

### Model Fallback Strategy

The endpoint uses a fallback strategy to ensure high availability:

1. **VISION_FAST**: For image analysis tasks
   - Primary: `gemini-2.5-flash-lite`
   - Fallbacks: `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-2.0-flash-lite`

2. **GENERATE_JSON**: For structured data generation
   - Primary: `gemini-2.5-flash-lite`
   - Fallbacks: `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-2.0-flash-lite`

3. **CHAT_INTERACTIVE**: For conversational interactions
   - Primary: `gemini-2.5-flash-lite`
   - Fallbacks: `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-2.0-flash-lite`

### Error Handling

The endpoint handles various error scenarios:

- **Authentication Errors (401/403)**: API key is invalid or unauthorized
- **Model Not Found (404)**: Requested model is unavailable, tries next fallback
- **Rate Limit (429)**: Retries with exponential backoff, then tries next model
- **Server Errors (500-504)**: Retries with exponential backoff, then tries next model

### Safety Configuration

All requests include safety settings to block harmful content:

- `HARM_CATEGORY_DANGEROUS_CONTENT`: BLOCK_MEDIUM_AND_ABOVE
- `HARM_CATEGORY_HARASSMENT`: BLOCK_MEDIUM_AND_ABOVE
- `HARM_CATEGORY_HATE_SPEECH`: BLOCK_MEDIUM_AND_ABOVE
- `HARM_CATEGORY_SEXUALLY_EXPLICIT`: BLOCK_MEDIUM_AND_ABOVE
- `HARM_CATEGORY_CIVIC_INTEGRITY`: BLOCK_MEDIUM_AND_ABOVE

System instruction includes agricultural safety rules:
- No instructions for chemical mixing or dosing
- No human/animal medical advice
- Recommendations for professional consultation

### Configuration

Required environment variables:

```bash
# Required - Gemini API key for server-side use
GEMINI_API_KEY=your_gemini_api_key_here

# Optional - Session secret for rate limiting
SESSION_SECRET=your_session_secret_here

# Optional - Server configuration
NODE_ENV=development
HOST=127.0.0.1
PORT=3001
```

### Usage Example

```typescript
// Client-side code
const response = await fetch('/api/analysis', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Important for session-based rate limiting
  body: JSON.stringify({
    taskType: 'VISION_FAST',
    prompt: 'Analyze this crop image for disease symptoms',
    image: 'data:image/jpeg;base64,...'
  })
});

const data = await response.json();

if (data.success) {
  console.log('AI Response:', data.result);
  console.log('Quota Remaining:', data.rateLimitInfo.quotaRemaining);
} else {
  console.error('Error:', data.error, data.message);
}
```

### Testing

Run tests with:
```bash
npm test -- server/routes/__tests__/analysis.test.ts
```

Tests cover:
- API key configuration and protection
- Request validation
- Response sanitization
- Image data handling
- Model fallback configuration
- Safety configuration
- Health check endpoint
- Rate limit integration
- Error handling

### Migration from Client-Side API Calls

If you're migrating from direct client-side Gemini API calls:

1. Remove `VITE_GEMINI_API_TOKEN` from environment variables
2. Update client code to call `/api/analysis` instead of Gemini API directly
3. Set `GEMINI_API_KEY` in server environment variables
4. Update request format to match the endpoint's expected structure
5. Handle rate limiting responses appropriately

### Monitoring and Logging

The endpoint logs:
- All analysis requests (with session ID and quota info)
- Validation failures
- API errors (with sanitized error messages)
- Successful completions

Logs are written using the centralized logger utility and include:
- Timestamp
- Session ID
- Request details (sanitized)
- Error information (sanitized)
- Rate limit status
