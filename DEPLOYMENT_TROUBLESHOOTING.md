# Deployment Troubleshooting Guide

## Build vs Runtime Failure Analysis

Your build logs show **"Build successful"**, which means the failure is occurring at **runtime** (application startup), not during the build phase.

## Diagnostic Logging Added

I've added comprehensive diagnostic logging to help identify the exact failure point:

### 1. Configuration Loading ([`backend/config.py`](backend/config.py))
- Logs when configuration starts loading
- Shows which environment variables are present/missing
- Catches and reports Pydantic validation errors

### 2. Database Connection ([`backend/database.py`](backend/database.py))
- Logs MongoDB connection attempts
- Reports connection success/failure with detailed error messages
- Includes common failure reasons (auth, network, IP whitelist)

### 3. Application Startup ([`backend/main.py`](backend/main.py))
- Logs application startup sequence
- Shows CORS configuration
- Reports router registration
- Catches startup failures

## Most Likely Root Causes

Based on code analysis, the two most probable issues are:

### 🔴 Issue #1: Missing Environment Variables (HIGHEST PROBABILITY)

**Problem:** [`config.py`](backend/config.py:8-14) requires these environment variables:
- `MONGODB_URI` (required)
- `JWT_SECRET` (required)
- `CLAUDE_API_KEY` (required)
- `FIRECRAWL_API_KEY` (required)
- `PERPLEXITY_API_KEY` (required)

**Symptom:** If any are missing, Pydantic will raise a `ValidationError` during import, causing immediate startup failure.

**Solution:**
1. Check your hosting platform's environment variable configuration
2. Ensure ALL required variables are set
3. Verify no typos in variable names (case-sensitive)

**Expected Log Output if this is the issue:**
```
🔧 Loading configuration...
❌ FATAL: Failed to load configuration
   Error Type: ValidationError
   Error Message: [field required]
```

### 🟡 Issue #2: MongoDB Connection Failure

**Problem:** [`database.py`](backend/database.py:9-16) connects to MongoDB during startup. Connection can fail due to:
- Invalid MongoDB URI
- Network connectivity issues
- Authentication failure
- IP address not whitelisted in MongoDB Atlas

**Symptom:** Application starts loading but crashes during database connection.

**Solution:**
1. Verify MongoDB URI is correct and includes credentials
2. Check MongoDB Atlas IP whitelist (add `0.0.0.0/0` for testing)
3. Verify database user has correct permissions
4. Test connection string locally

**Expected Log Output if this is the issue:**
```
🔧 Loading configuration...
✅ Configuration loaded successfully
🚀 Starting UpdateQ API...
🔌 Attempting to connect to MongoDB...
❌ FATAL: Failed to connect to MongoDB
   Error Type: ServerSelectionTimeoutError
```

## How to Get Runtime Logs

To diagnose the issue, you need to retrieve the **application/runtime logs** from your hosting provider:

### Render.com
```bash
# Via Dashboard
1. Go to your service dashboard
2. Click "Logs" tab
3. Look for stderr output with 🔧, ✅, or ❌ emojis

# Via CLI
render logs -s <service-name>
```

### Railway.app
```bash
# Via Dashboard
1. Open your project
2. Click on the deployment
3. View "Deploy Logs" tab
4. Look for application startup logs

# Via CLI
railway logs
```

### Heroku
```bash
heroku logs --tail --app <app-name>
```

### DigitalOcean App Platform
```bash
# Via Dashboard
1. Go to your app
2. Click "Runtime Logs"
3. Filter by component (web)
```

## What to Look For in Logs

Search for these diagnostic markers:

1. **Configuration Loading:**
   ```
   🔧 Loading configuration...
   ```
   - If you see ❌ here, environment variables are missing

2. **MongoDB Connection:**
   ```
   🔌 Attempting to connect to MongoDB...
   ```
   - If you see ❌ here, database connection failed

3. **Application Startup:**
   ```
   🚀 Starting UpdateQ API...
   ```
   - If you don't see this, the app crashed before startup

## Quick Fixes

### Fix #1: Environment Variables
Ensure these are set in your hosting platform:
```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/updateq?retryWrites=true&w=majority
JWT_SECRET=your-secret-key-here
CLAUDE_API_KEY=sk-ant-...
FIRECRAWL_API_KEY=fc-...
PERPLEXITY_API_KEY=pplx-...
CORS_ORIGINS=https://your-frontend-domain.com
APP_ENV=production
```

### Fix #2: MongoDB Atlas IP Whitelist
1. Go to MongoDB Atlas dashboard
2. Navigate to Network Access
3. Add IP address `0.0.0.0/0` (allows all IPs - for testing only)
4. Or add your hosting provider's IP ranges

### Fix #3: Port Configuration
Most hosting platforms expect your app to bind to `0.0.0.0` and use the `PORT` environment variable:

Your app already does this correctly via uvicorn, but verify your hosting platform's start command:
```bash
# Correct start command (for local development)
python main.py

# For production with custom port
uvicorn main:app --host 0.0.0.0 --port $PORT
```

## Next Steps

1. **Retrieve runtime logs** from your hosting provider
2. **Look for the diagnostic emojis** (🔧, 🔌, 🚀, ❌, ✅)
3. **Identify which step failed** based on the logs
4. **Apply the corresponding fix** from above
5. **Redeploy** and check logs again

## Need More Help?

If the logs show a different error than expected, please share:
1. The complete runtime/application logs (not just build logs)
2. Your hosting platform name
3. The specific error message with the ❌ emoji