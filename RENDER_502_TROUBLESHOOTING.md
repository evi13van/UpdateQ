# Render 502 Bad Gateway - Troubleshooting Guide

## 🔴 Problem: 502 Bad Gateway Error

You're seeing a 502 error on your deployed Render frontend at `updateq-frontend.onrender.com`. This indicates the frontend service is failing to start or crashing immediately after deployment.

## 🔍 Root Cause Analysis

Based on the configuration analysis, here are the likely causes:

### 1. **Missing Production Environment Variable** ⚠️ CRITICAL
**Issue:** The frontend `.env` file contains:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

This hardcoded `localhost` URL will NOT work in production. The frontend needs to know the actual backend URL.

**Impact:** 
- Frontend builds successfully but fails at runtime
- API calls fail, causing the app to crash
- Results in 502 Bad Gateway

### 2. **Incorrect Render Service Configuration**
The frontend service on Render needs proper environment variables and build settings.

### 3. **Build Command Issues**
Next.js standalone builds require specific configuration.

## ✅ Solution: Complete Render Deployment Setup

### Step 1: Configure Backend Service on Render

1. **Create Backend Web Service:**
   - Repository: Your GitHub repo
   - Branch: `main`
   - Root Directory: `backend`
   - Runtime: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

2. **Set Backend Environment Variables:**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
   JWT_SECRET=your-secret-key-here
   CLAUDE_API_KEY=your-claude-api-key
   FIRECRAWL_API_KEY=your-firecrawl-api-key
   PERPLEXITY_API_KEY=your-perplexity-api-key
   CORS_ORIGINS=https://updateq-frontend.onrender.com
   ```

3. **Note the Backend URL:**
   After deployment, your backend will be at: `https://your-backend-name.onrender.com`

### Step 2: Configure Frontend Service on Render

1. **Create Frontend Web Service:**
   - Repository: Your GitHub repo
   - Branch: `main`
   - Root Directory: `frontend`
   - Runtime: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

2. **Set Frontend Environment Variables:** ⚠️ **CRITICAL**
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-name.onrender.com/api/v1
   NODE_ENV=production
   ```

   **Replace `your-backend-name` with your actual backend service name!**

### Step 3: Verify Configuration Files

Ensure these files are correctly configured:

#### `frontend/next.config.ts`
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Remove or conditionally apply rewrites for production
  async rewrites() {
    // Only use rewrites in development
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:8000/api/:path*',
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
```

#### `frontend/package.json` (verify scripts)
```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

## 🧪 Testing the Fix

### 1. Test Build Locally
```bash
cd frontend
npm run build
npm start
```

If the build fails locally, fix those errors first before deploying.

### 2. Check Render Deployment Logs

After deploying, check the logs in Render dashboard:

**Look for:**
- ✅ `Build succeeded`
- ✅ `Server listening on port XXXX`
- ✅ No crash loops

**Red flags:**
- ❌ `Error: Cannot find module`
- ❌ `ECONNREFUSED` (API connection errors)
- ❌ `Exited with status 1`

### 3. Test the Deployed Site

1. Visit `https://updateq-frontend.onrender.com`
2. Open browser DevTools → Network tab
3. Check if API calls are going to the correct backend URL
4. Look for any 404 or CORS errors

## 🔧 Common Issues & Fixes

### Issue: "Cannot connect to backend"
**Cause:** `NEXT_PUBLIC_API_URL` not set or incorrect
**Fix:** Set the environment variable in Render dashboard to your backend URL

### Issue: "CORS error"
**Cause:** Backend `CORS_ORIGINS` doesn't include frontend URL
**Fix:** Add frontend URL to backend's `CORS_ORIGINS` environment variable

### Issue: "Build succeeds but site crashes"
**Cause:** Runtime error in the application
**Fix:** Check Render logs for the specific error and fix the code

### Issue: "Port binding error"
**Cause:** Start command not using `$PORT` variable
**Fix:** Ensure start command is `npm start` (Next.js handles PORT automatically)

## 📋 Deployment Checklist

Before deploying, verify:

- [ ] Backend service created and deployed successfully
- [ ] Backend URL noted (e.g., `https://updateq-backend.onrender.com`)
- [ ] Frontend `NEXT_PUBLIC_API_URL` set to backend URL
- [ ] Backend `CORS_ORIGINS` includes frontend URL
- [ ] All API keys set in backend environment variables
- [ ] MongoDB Atlas IP whitelist set to `0.0.0.0/0`
- [ ] Local build test passes (`npm run build`)
- [ ] `next.config.ts` has `output: "standalone"`

## 🚀 Deployment Order

1. **Deploy Backend First**
   - Wait for successful deployment
   - Note the backend URL
   - Test health endpoint: `https://your-backend.onrender.com/healthz`

2. **Configure Frontend Environment**
   - Set `NEXT_PUBLIC_API_URL` to backend URL
   - Commit any code changes if needed

3. **Deploy Frontend**
   - Wait for successful deployment
   - Check logs for errors
   - Test the site

## 📊 Expected Results

After proper configuration:

- ✅ Frontend loads without 502 error
- ✅ API calls successfully reach backend
- ✅ No CORS errors
- ✅ Authentication works
- ✅ All features functional

## 🆘 Still Having Issues?

If you're still seeing 502 errors after following this guide:

1. **Check Render Logs:**
   - Frontend service logs
   - Backend service logs
   - Look for specific error messages

2. **Verify Environment Variables:**
   - Double-check all URLs are correct
   - No typos in API keys
   - No trailing slashes in URLs

3. **Test Backend Independently:**
   ```bash
   curl https://your-backend.onrender.com/healthz
   ```
   Should return: `{"status": "healthy", "database": "connected"}`

4. **Check Browser Console:**
   - Open DevTools → Console
   - Look for JavaScript errors
   - Check Network tab for failed requests

## 📝 Notes

- Render free tier services may spin down after inactivity (causing initial slow load)
- First request after spin-down may take 30-60 seconds
- Consider upgrading to paid tier for always-on services
- Environment variables changes require manual redeploy

---

**Last Updated:** 2026-01-08
**Status:** Ready for deployment with proper configuration