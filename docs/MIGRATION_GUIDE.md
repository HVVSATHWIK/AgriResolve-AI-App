# Migration Guide: Backend API Proxy Security Update

This guide helps you migrate from the previous architecture (direct Gemini API calls from frontend) to the new secure backend proxy architecture.

## Overview

**What Changed:**
- Gemini API calls now go through a secure backend proxy
- API keys are stored server-side only (never exposed to clients)
- Session-based rate limiting added
- Graceful degradation for service failures
- Disease risk assessment integrated

**Why:**
- **Security**: API keys are no longer exposed in client-side code
- **Control**: Rate limiting and request validation on the backend
- **Reliability**: Graceful handling of service failures
- **Features**: Disease risk assessment with weather data integration

## Prerequisites

Before starting the migration:

- [ ] Node.js 18+ installed
- [ ] Access to backend server environment
- [ ] Gemini API key
- [ ] Ability to set environment variables
- [ ] (Optional) Process manager (PM2, systemd, etc.)

## Migration Steps

### Step 1: Backend Server Setup

#### 1.1 Install Dependencies

The backend dependencies should already be in `package.json`. Install them:

```bash
npm install
```

Key backend dependencies:
- `express` - Web server framework
- `express-session` - Session management
- `express-rate-limit` - Rate limiting
- `cors` - CORS handling
- `helmet` - Security headers
- `@google/genai` - Gemini API client

#### 1.2 Configure Environment Variables

Create or update `.env` file in project root:

```env
# REQUIRED: Gemini API Key (backend only)
GEMINI_API_KEY=your-gemini-api-key-here

# REQUIRED: Session secret for secure sessions
SESSION_SECRET=generate-a-strong-random-secret-here

# OPTIONAL: Server configuration
HOST=127.0.0.1
PORT=3001
NODE_ENV=development

# OPTIONAL: Frontend URL for CORS
FRONTEND_URL=http://localhost:5173
```

**Important Security Notes:**
- Generate a strong random string for `SESSION_SECRET` (32+ characters)
- Never commit `.env` to version control
- Use different secrets for development and production

#### 1.3 Generate Session Secret

Generate a secure session secret:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using OpenSSL
openssl rand -hex 32
```

### Step 2: Start Backend Server

#### Development Mode

```bash
# Start backend server
npm run server

# Or with auto-reload
npm run server:dev
```

The backend will start on `http://127.0.0.1:3001` by default.

#### Production Mode

```bash
# Set production environment
export NODE_ENV=production
export HOST=0.0.0.0
export PORT=3001

# Start server
npm run server

# Or use a process manager (recommended)
pm2 start server/index.ts --name agriresolve-backend
```

### Step 3: Frontend Configuration

#### 3.1 Remove Old API Key

**CRITICAL**: Remove the Gemini API key from frontend environment:

```bash
# Edit .env file and REMOVE this line:
# VITE_GEMINI_API_TOKEN=...

# Or delete the variable
unset VITE_GEMINI_API_TOKEN
```

#### 3.2 Configure API URL (Optional)

If your backend is on a different domain:

```env
# .env (frontend)
VITE_API_URL=https://api.yourdomain.com/api
```

For same-origin deployment (recommended), you can omit this or use:

```env
VITE_API_URL=/api
```

#### 3.3 Rebuild Frontend

```bash
# Rebuild frontend with new configuration
npm run build
```

### Step 4: Verify Migration

#### 4.1 Check Backend Health

```bash
# Test health endpoint
curl http://localhost:3001/api/health

# Expected response:
# {
#   "status": "healthy" or "degraded",
#   "timestamp": "...",
#   "services": {
#     "gemini": { "available": true, "message": "..." },
#     "weather": { "available": true, "message": "..." }
#   }
# }
```

#### 4.2 Test Analysis Endpoint

```bash
# Test analysis endpoint
curl -X POST http://localhost:3001/api/analysis \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "GENERATE_JSON",
    "prompt": "Test prompt",
    "image": "data:image/jpeg;base64,..."
  }'
```

#### 4.3 Verify API Key Protection

**Critical Security Check:**

1. Open browser developer tools (F12)
2. Go to Network tab
3. Perform an analysis request
4. Inspect the request and response
5. **Verify**: API key should NOT appear anywhere

✅ **Pass**: No API key visible in network traffic
❌ **Fail**: API key visible - DO NOT DEPLOY

#### 4.4 Test Rate Limiting

```bash
# Make multiple requests quickly
for i in {1..6}; do
  curl -X POST http://localhost:3001/api/analysis \
    -H "Content-Type: application/json" \
    -H "Cookie: connect.sid=..." \
    -d '{"taskType":"GENERATE_JSON","prompt":"test"}' &
done
wait

# Expected: Some requests should return 429 (Rate Limit Exceeded)
```

### Step 5: Production Deployment

#### 5.1 Environment Configuration

Production `.env`:

```env
# Production settings
NODE_ENV=production
HOST=0.0.0.0
PORT=3001

# Security
GEMINI_API_KEY=your-production-api-key
SESSION_SECRET=your-production-session-secret

# CORS
FRONTEND_URL=https://yourdomain.com
```

#### 5.2 Security Checklist

- [ ] `NODE_ENV=production` set
- [ ] Strong `SESSION_SECRET` configured
- [ ] `GEMINI_API_KEY` stored securely (not in code)
- [ ] HTTPS enabled for production
- [ ] `FRONTEND_URL` set to actual domain
- [ ] Firewall configured to restrict backend port access
- [ ] No API keys in frontend code or environment
- [ ] Session cookies set to `secure` and `httpOnly`

#### 5.3 Reverse Proxy Setup (Recommended)

Use nginx or similar to proxy requests:

```nginx
# nginx configuration
server {
    listen 443 ssl;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 5.4 Process Management

Use PM2 or systemd to manage the backend process:

```bash
# PM2
pm2 start server/index.ts --name agriresolve-backend
pm2 save
pm2 startup

# Or systemd service
sudo systemctl enable agriresolve-backend
sudo systemctl start agriresolve-backend
```

### Step 6: Monitoring and Maintenance

#### 6.1 Health Monitoring

Set up monitoring for:
- `/api/health` endpoint (should return 200 or 503)
- Backend process uptime
- API rate limit usage
- Error logs

#### 6.2 Log Monitoring

Monitor logs for:
- API key exposure warnings
- Rate limit violations
- Service degradation events
- Authentication failures

```bash
# View logs (PM2)
pm2 logs agriresolve-backend

# View logs (systemd)
journalctl -u agriresolve-backend -f
```

#### 6.3 Regular Security Audits

- [ ] Review API key access logs
- [ ] Rotate API keys periodically
- [ ] Update dependencies regularly
- [ ] Review rate limit settings
- [ ] Check for security vulnerabilities

## Rollback Plan

If you need to rollback:

### Quick Rollback (Not Recommended)

1. Stop backend server
2. Restore `VITE_GEMINI_API_TOKEN` in frontend
3. Rebuild and redeploy frontend
4. **Note**: This exposes API keys again - use only as emergency measure

### Proper Rollback

1. Identify and fix the issue
2. Test in development environment
3. Deploy fixed version
4. Keep backend proxy architecture (more secure)

## Troubleshooting

### Backend won't start

**Error**: "GEMINI_API_KEY not found"
- **Solution**: Set `GEMINI_API_KEY` in `.env` file

**Error**: "Port 3001 already in use"
- **Solution**: Change `PORT` in `.env` or stop conflicting process

### Frontend can't connect to backend

**Error**: CORS errors in browser console
- **Solution**: Set `FRONTEND_URL` to match your frontend domain
- **Check**: Protocol (http/https) must match

**Error**: 404 on `/api/analysis`
- **Solution**: Ensure backend is running
- **Check**: `VITE_API_URL` points to correct backend

### Rate limiting issues

**Error**: Immediately rate limited
- **Solution**: Clear browser cookies
- **Check**: Session management is working

**Error**: Rate limits not enforced
- **Solution**: Verify `SESSION_SECRET` is set
- **Check**: Session middleware is loaded

### API key still exposed

**Error**: API key visible in network traffic
- **Solution**: Ensure frontend is using new API client
- **Check**: Remove `VITE_GEMINI_API_TOKEN` from frontend
- **Verify**: Rebuild frontend after removing key

## Testing Procedures

### Security Verification

```bash
# 1. Test API key protection
npm run test:security

# 2. Test rate limiting
npm run test:ratelimit

# 3. Test graceful degradation
npm run test:degradation
```

### Manual Testing Checklist

- [ ] Analysis request works through backend
- [ ] API key not visible in browser network tab
- [ ] Rate limiting enforces limits correctly
- [ ] Session persists across requests
- [ ] Health endpoints return correct status
- [ ] Error messages are user-friendly
- [ ] Graceful degradation works when services fail

## Support

If you encounter issues during migration:

1. Check logs for error messages
2. Verify environment variables are set correctly
3. Test backend health endpoints
4. Review security checklist
5. Consult `ENV_VARIABLES.md` for configuration details

## References

- Environment Variables: `docs/ENV_VARIABLES.md`
- Requirements: `.kiro/specs/agricultural-accuracy-and-security-fixes/requirements.md`
- Design Document: `.kiro/specs/agricultural-accuracy-and-security-fixes/design.md`
- Security Requirements: 5.1, 5.2, 6.1
