# Environment Variables Documentation

This document describes all environment variables used in the AgriResolve-AI application.

## Backend Environment Variables

### Required Variables

#### `GEMINI_API_KEY`
- **Description**: API key for Google Gemini AI service
- **Required**: Yes (backend only)
- **Format**: String starting with "AI" followed by alphanumeric characters
- **Example**: `AIzaSyD...`
- **Security**: 
  - **CRITICAL**: This must ONLY be set in the backend environment
  - Never expose this key in frontend code or client-side environment variables
  - Store securely using environment variable management tools
- **Requirements**: 5.4, 6.1, 6.3

#### `SESSION_SECRET`
- **Description**: Secret key for session management and cookie signing
- **Required**: Yes
- **Format**: Random string (minimum 32 characters recommended)
- **Example**: `your-super-secret-session-key-change-in-production`
- **Security**:
  - Use a cryptographically secure random string
  - Change the default value in production
  - Never commit this to version control
- **Requirements**: 5.4, 6.1

### Optional Variables

#### `HOST`
- **Description**: Host address for the backend server to bind to
- **Required**: No
- **Default**: 
  - Development: `127.0.0.1` (localhost only)
  - Production: `0.0.0.0` (all interfaces)
- **Format**: IP address or hostname
- **Example**: `0.0.0.0`
- **Security**: In development, defaults to localhost for security
- **Requirements**: 6.1, 6.3

#### `PORT`
- **Description**: Port number for the backend server
- **Required**: No
- **Default**: `3001`
- **Format**: Integer (1-65535)
- **Example**: `3001`
- **Requirements**: 6.1, 6.3

#### `FRONTEND_URL` / `CLIENT_URL`
- **Description**: URL of the frontend application for CORS configuration
- **Required**: No
- **Default**: `http://localhost:5173`
- **Format**: Full URL including protocol
- **Example**: `https://agriresolve.example.com`
- **Security**: Configure this to match your frontend domain in production
- **Requirements**: 6.1

#### `NODE_ENV`
- **Description**: Application environment mode
- **Required**: No
- **Default**: `development`
- **Format**: `development` | `production` | `test`
- **Example**: `production`
- **Impact**:
  - Affects security settings (HTTPS cookies, CORS, etc.)
  - Changes default HOST binding
  - Enables/disables certain logging
- **Requirements**: 6.1, 6.3

## Frontend Environment Variables

### Deprecated Variables

#### `GEMINI_SERVICE_TOKEN` (formerly `VITE_GEMINI_API_KEY`)
- **Description**: API key for Google Gemini AI service (Client-Side)
- **Required**: Yes
- **Format**: String starting with "AI"
- **Security**: 
  - Exposed to client browser
  - Use restricted API keys in production (limit to specific domains)

### Optional Variables

#### `VITE_API_URL`
- **Description**: Base URL for backend API
- **Required**: No
- **Default**: `/api` (same origin)
- **Format**: URL path or full URL
- **Example**: `https://api.agriresolve.example.com/api`
- **Note**: In production, typically uses same origin (`/api`)

## Environment File Setup

### Backend (.env)

Create a `.env` file in the project root:

```env
# Required
GEMINI_API_KEY=your-gemini-api-key-here
SESSION_SECRET=your-super-secret-session-key-change-in-production

# Optional
HOST=127.0.0.1
PORT=3001
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Frontend (.env)

Create a `.env` file in the project root (if needed):

```env
# Optional
VITE_API_URL=/api

# Client-Side Gemini API
VITE_GEMINI_API_KEY=your-api-key-here
```

## Security Best Practices

### 1. API Key Management
- ✅ Store `GEMINI_API_KEY` only in backend environment
- ✅ Use environment variable management tools (e.g., AWS Secrets Manager, HashiCorp Vault)
- ✅ Rotate API keys regularly
- ❌ Never commit API keys to version control
- ❌ Never expose API keys in frontend code

### 2. Session Security
- ✅ Use a strong, random `SESSION_SECRET`
- ✅ Change default secrets in production
- ✅ Enable secure cookies in production (`NODE_ENV=production`)
- ✅ Use HTTPS in production

### 3. CORS Configuration
- ✅ Set `FRONTEND_URL` to your actual frontend domain
- ✅ Restrict CORS to specific origins in production
- ❌ Don't use wildcard (`*`) CORS in production

### 4. Host Binding
- ✅ Use `127.0.0.1` in development (localhost only)
- ✅ Use `0.0.0.0` in production (with proper firewall rules)
- ✅ Configure firewall to restrict access to backend port

## Verification

### Check Backend Configuration

```bash
# Verify API key is set (backend)
echo $GEMINI_API_KEY | head -c 10

# Verify session secret is set
echo $SESSION_SECRET | head -c 10

# Check server will bind to correct host
echo $HOST
```

### Check Frontend Configuration

```bash
# Verify API key is set
echo $VITE_GEMINI_API_KEY

# Check API URL
echo $VITE_API_URL
```

### Test Security

1. **API Key Protection**: Inspect frontend network requests - API key should never appear
2. **Session Management**: Check that session cookies are HttpOnly and Secure (in production)
3. **CORS**: Verify that only your frontend domain can access the API

## Troubleshooting

### "Gemini API key not configured"
- Ensure `GEMINI_API_KEY` is set in backend environment
- Check for whitespace or formatting issues in the key
- Verify the key is valid by testing with Google's API

### "CORS Error"
- Set `FRONTEND_URL` to match your frontend domain
- Ensure protocol (http/https) matches
- Check that credentials are included in frontend requests

### "Session not persisting"
- Verify `SESSION_SECRET` is set
- Check that cookies are enabled in browser
- Ensure `secure` cookie setting matches your protocol (HTTPS in production)

### "Rate limit not working"
- Sessions must be working correctly for rate limiting
- Check `SESSION_SECRET` is configured
- Verify session middleware is loaded before rate limiter

## Migration from Direct API Calls

If you previously used `VITE_GEMINI_API_TOKEN` in the frontend:

1. **Rename** `VITE_GEMINI_API_TOKEN` to `VITE_GEMINI_API_KEY` in frontend `.env`
2. **Update** backend `.env` to use `GEMINI_API_KEY`
3. **Verify** that both keys are set correctly if using hybrid mode

## References

- Requirements: 5.1, 5.2, 5.4, 6.1, 6.3
- Security Design: See `design.md` Section 2.1
- Migration Guide: See `MIGRATION_GUIDE.md`
