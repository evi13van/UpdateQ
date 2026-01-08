# Render Deployment Fix - MongoDB SSL Error Resolution

## 🔍 Problem Diagnosis

**Error:** `pymongo.errors.ServerSelectionTimeoutError: SSL handshake failed: [SSL: TLSV1_ALERT_INTERNAL_ERROR]`

**Root Cause:** MongoDB Atlas IP whitelist restriction blocking Render's dynamic IP addresses.

## ✅ Solutions Applied

### 1. MongoDB Atlas IP Whitelist Configuration ✓

**Status:** COMPLETED by user

MongoDB Atlas has been configured to allow connections from `0.0.0.0/0` (all IPs), which is required for Render's dynamic IP infrastructure.

**Why this is necessary:**
- Render uses dynamic, rotating IP addresses for outbound connections
- MongoDB Atlas blocks non-whitelisted IPs before SSL negotiation
- This causes the SSL handshake to fail with `TLSV1_ALERT_INTERNAL_ERROR`

**Security Note:** While `0.0.0.0/0` allows all IPs, your connection remains secure through:
- Username/password authentication in connection string
- TLS/SSL encryption (enforced by MongoDB Atlas)
- MongoDB Atlas's built-in security features

### 2. Port Configuration Fix ✓

**Status:** COMPLETED

Updated [`backend/main.py`](backend/main.py:62-67) to use Render's `PORT` environment variable:

```python
if __name__ == "__main__":
    import uvicorn
    import os
    # Use PORT environment variable for Render compatibility, fallback to 8000 for local dev
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
```

**Why this is necessary:**
- Render dynamically assigns ports via the `PORT` environment variable
- Hardcoding port 8000 causes "Port scan timeout" errors
- The fix maintains local development compatibility (defaults to 8000)

## 📋 Render Environment Variables Checklist

Ensure these are configured in your Render service settings:

- ✅ `MONGODB_URI` - Your MongoDB Atlas connection string
- ✅ `JWT_SECRET` - Your JWT secret key
- ✅ `CLAUDE_API_KEY` - Your Anthropic Claude API key
- ✅ `FIRECRAWL_API_KEY` - Your Firecrawl API key
- ✅ `PERPLEXITY_API_KEY` - Your Perplexity API key
- ✅ `CORS_ORIGINS` - Your frontend URL(s), comma-separated
- ⚠️ `PORT` - Automatically set by Render (do not manually configure)

## 🧪 Verification Steps

### Local Testing (Already Verified ✓)

The diagnostic test confirmed:
- ✅ MongoDB connection successful
- ✅ SSL/TLS configuration correct
- ✅ Database access working
- ✅ Collections accessible

### Render Deployment Testing

After deploying to Render:

1. **Check Deployment Logs:**
   ```
   Look for:
   ✅ "Connected to MongoDB Atlas successfully"
   ✅ "Application startup complete"
   ```

2. **Test Health Endpoint:**
   ```bash
   curl https://your-app.onrender.com/healthz
   ```
   Expected response:
   ```json
   {"status": "healthy", "database": "connected"}
   ```

3. **Monitor for Errors:**
   - No more `SSL: TLSV1_ALERT_INTERNAL_ERROR`
   - No more "Port scan timeout" errors

## 🔧 Code Changes Summary

### Files Modified:
1. **backend/main.py** - Added PORT environment variable support
2. **backend/test_mongodb_connection.py** - Created diagnostic tool (optional, for testing)

### Dependencies (Already Correct):
- ✅ `certifi>=2024.0.0` - SSL certificate handling
- ✅ `motor>=3.6.0` - Async MongoDB driver
- ✅ `tlsCAFile=certifi.where()` - Proper SSL configuration in database.py

## 🚀 Deployment Instructions

1. **Commit and Push Changes:**
   ```bash
   git add backend/main.py
   git commit -m "Fix: Add PORT env var support for Render deployment"
   git push origin main
   ```

2. **Render Auto-Deploy:**
   - Render will automatically detect the push and redeploy
   - Monitor the deployment logs for success messages

3. **Verify Deployment:**
   - Check logs for MongoDB connection success
   - Test the `/healthz` endpoint
   - Test your application functionality

## 🐛 Troubleshooting

### If MongoDB Connection Still Fails:

1. **Verify IP Whitelist:**
   - Go to MongoDB Atlas → Network Access
   - Confirm `0.0.0.0/0` is listed and active

2. **Check Environment Variables:**
   - Render Dashboard → Your Service → Environment
   - Verify `MONGODB_URI` is set correctly
   - Ensure no extra spaces or quotes

3. **Check MongoDB URI Format:**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
   ```

4. **Verify MongoDB Atlas Cluster:**
   - Ensure cluster is running (not paused)
   - Check cluster region and tier

### If Port Issues Persist:

1. **Verify Render Configuration:**
   - Ensure "Start Command" is set correctly
   - Default: `uvicorn main:app --host 0.0.0.0 --port $PORT`

2. **Check Logs:**
   - Look for "Binding to 0.0.0.0:XXXXX" messages
   - Verify the port number matches Render's assignment

## 📊 Expected Results

After applying these fixes:

- ✅ MongoDB connection establishes successfully on Render
- ✅ No SSL handshake errors
- ✅ Application binds to correct port
- ✅ Health check endpoint responds correctly
- ✅ All API endpoints functional

## 🔐 Security Considerations

**IP Whitelist (`0.0.0.0/0`):**
- Required for Render's dynamic IP infrastructure
- Connection still secured by authentication and TLS
- Alternative: Use MongoDB Atlas Private Endpoints (requires paid plan)

**Environment Variables:**
- Never commit `.env` files to git
- Use Render's environment variable management
- Rotate secrets regularly

## 📚 Additional Resources

- [Render Environment Variables](https://render.com/docs/environment-variables)
- [MongoDB Atlas Network Access](https://www.mongodb.com/docs/atlas/security/ip-access-list/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)

---

**Status:** Ready for deployment ✅
**Last Updated:** 2026-01-08