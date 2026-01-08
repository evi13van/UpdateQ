# Fixing 404 Error on Render Deployment

## Problem
Your Next.js app at https://updateq-frontend.onrender.com/ is returning a 404 error.

## Root Causes

### 1. Standalone Build Configuration Issue
Your `next.config.ts` has `output: "standalone"` which requires a specific start command.

### 2. Missing Environment Variables
The `NEXT_PUBLIC_API_URL` is not set in production, causing the app to fail.

## Solution Steps

### Step 1: Update Render Service Configuration

Go to your Render dashboard → updateq-frontend service → Settings

#### Build Command
```bash
npm install && npm run build
```

#### Start Command (Choose ONE)

**Option A - For Standalone Build (RECOMMENDED):**
```bash
cd .next/standalone && node server.js
```

**Option B - Standard Next.js:**
```bash
npm start
```

**Option C - If using PORT variable:**
```bash
node .next/standalone/server.js
```

### Step 2: Set Environment Variables

In Render → Environment tab, add these variables:

```
NEXT_PUBLIC_API_URL=https://updateq-backend.onrender.com/api/v1
NODE_ENV=production
```

**IMPORTANT:** Replace `updateq-backend` with your actual backend service name!

### Step 3: Verify Root Directory

Ensure this is set correctly:
```
Root Directory: frontend
```

### Step 4: Manual Deploy

After making these changes:
1. Click "Manual Deploy" → "Deploy latest commit"
2. Watch the logs for any errors
3. Wait for deployment to complete (5-10 minutes)

## Alternative: Remove Standalone Output

If the above doesn't work, you can temporarily remove the standalone configuration:

**Edit `frontend/next.config.ts`:**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove or comment out this line:
  // output: "standalone",
  
  devIndicators: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
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

Then use standard commands:
- Build: `npm install && npm run build`
- Start: `npm start`

## Debugging Steps

### 1. Check Render Logs

In your Render dashboard, click on "Logs" to see:
- Build output
- Any error messages
- Server startup logs

Look for errors like:
- "Cannot find module"
- "ENOENT: no such file or directory"
- Port binding issues

### 2. Test Build Locally

Before deploying, test the production build locally:

```bash
cd frontend
npm run build
npm start
```

Visit http://localhost:3000 - if it works locally, the issue is Render-specific.

### 3. Verify File Structure

After build completes, check that these exist:
- `.next/standalone/server.js`
- `.next/static/`
- `public/`

### 4. Check Port Configuration

Render automatically sets the `PORT` environment variable. Your app should listen on `process.env.PORT || 3000`.

Next.js handles this automatically, but verify in logs that it's binding to the correct port.

## Common Error Messages & Solutions

### "Cannot GET /"
- **Cause:** Wrong start command or build failed
- **Fix:** Use correct start command for standalone build

### "Module not found"
- **Cause:** Dependencies not installed
- **Fix:** Ensure `npm install` runs before `npm run build`

### "Port already in use"
- **Cause:** Multiple instances trying to start
- **Fix:** Render handles this automatically, but check logs

### "NEXT_PUBLIC_API_URL is undefined"
- **Cause:** Environment variable not set
- **Fix:** Add in Render Environment tab and redeploy

## Quick Checklist

- [ ] Root Directory set to `frontend`
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `cd .next/standalone && node server.js` OR `npm start`
- [ ] Environment variable `NEXT_PUBLIC_API_URL` set
- [ ] Environment variable `NODE_ENV=production` set
- [ ] Manual deploy triggered after changes
- [ ] Logs checked for errors
- [ ] Backend service is running and accessible

## Still Not Working?

If you've tried everything above:

1. **Check Backend First**
   ```bash
   curl https://updateq-backend.onrender.com/healthz
   ```
   Should return: `{"status":"healthy","database":"connected"}`

2. **Try Without Standalone**
   - Remove `output: "standalone"` from `next.config.ts`
   - Use standard `npm start` command
   - Redeploy

3. **Check Render Status**
   - Visit https://status.render.com/
   - Ensure no platform-wide issues

4. **Contact Support**
   - Render support can check server-side logs
   - Provide your service ID and deployment ID

## Expected Result

After fixing, you should see:
- ✅ https://updateq-frontend.onrender.com/ loads successfully
- ✅ Landing page displays
- ✅ No 404 errors
- ✅ API calls work (check browser console)
- ✅ Login/register functions work

---

**Last Updated:** 2026-01-08
**Status:** Troubleshooting Guide