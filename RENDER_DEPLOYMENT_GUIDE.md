# Complete Render Deployment Guide for UpdateQ

## 🎯 Overview

This guide provides step-by-step instructions to deploy both the frontend and backend of UpdateQ to Render, fixing the 502 Bad Gateway error.

## 🔴 Root Cause of 502 Error

The 502 error was caused by:
1. **Build failure** - `useSearchParams()` not wrapped in Suspense boundary (FIXED ✅)
2. **Missing production environment variable** - `NEXT_PUBLIC_API_URL` pointing to localhost
3. **Incorrect Next.js configuration** - Rewrites applied in production

## ✅ Fixes Applied

### 1. Fixed Suspense Boundary Error
**File:** `frontend/app/analyze/page.tsx`
- Wrapped component using `useSearchParams()` in a Suspense boundary
- This allows the build to complete successfully

### 2. Updated Next.js Configuration
**File:** `frontend/next.config.ts`
- Rewrites now only apply in development mode
- Production uses direct API calls via `NEXT_PUBLIC_API_URL`

### 3. Created Environment Variable Template
**File:** `frontend/.env.example`
- Documents required environment variables for deployment

## 🚀 Deployment Steps

### Prerequisites
- GitHub repository with your code
- Render account (free tier works)
- MongoDB Atlas cluster (with IP whitelist set to `0.0.0.0/0`)
- API keys for Claude, Firecrawl, and Perplexity

---

### Step 1: Deploy Backend Service

1. **Create New Web Service on Render:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Backend Service:**
   ```
   Name: updateq-backend (or your preferred name)
   Region: Choose closest to your users
   Branch: main
   Root Directory: backend
   Runtime: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

3. **Set Environment Variables:**
   Click "Environment" tab and add:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
   JWT_SECRET=your-secret-key-minimum-32-characters
   CLAUDE_API_KEY=sk-ant-xxxxx
   FIRECRAWL_API_KEY=fc-xxxxx
   PERPLEXITY_API_KEY=pplx-xxxxx
   CORS_ORIGINS=https://updateq-frontend.onrender.com
   ```
   
   **Important Notes:**
   - Replace `username:password@cluster` with your MongoDB credentials
   - Generate a strong JWT_SECRET (at least 32 characters)
   - Update `CORS_ORIGINS` with your actual frontend URL (see Step 2)
   - `PORT` is automatically set by Render - don't add it manually

4. **Deploy Backend:**
   - Click "Create Web Service"
   - Wait for deployment to complete (5-10 minutes)
   - Note your backend URL: `https://updateq-backend.onrender.com`

5. **Verify Backend:**
   ```bash
   curl https://updateq-backend.onrender.com/healthz
   ```
   Should return: `{"status":"healthy","database":"connected"}`

---

### Step 2: Deploy Frontend Service

1. **Create New Web Service on Render:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Frontend Service:**
   ```
   Name: updateq-frontend (or your preferred name)
   Region: Same as backend
   Branch: main
   Root Directory: frontend
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

3. **Set Environment Variables:** ⚠️ **CRITICAL**
   Click "Environment" tab and add:
   ```
   NEXT_PUBLIC_API_URL=https://updateq-backend.onrender.com/api/v1
   NODE_ENV=production
   ```
   
   **Replace `updateq-backend` with your actual backend service name!**

4. **Deploy Frontend:**
   - Click "Create Web Service"
   - Wait for deployment to complete (5-10 minutes)
   - Your frontend will be at: `https://updateq-frontend.onrender.com`

5. **Update Backend CORS:**
   - Go back to your backend service
   - Update `CORS_ORIGINS` environment variable with your actual frontend URL
   - Trigger a manual deploy to apply changes

---

## 🧪 Testing Your Deployment

### 1. Test Backend Health
```bash
curl https://your-backend.onrender.com/healthz
```
Expected: `{"status":"healthy","database":"connected"}`

### 2. Test Frontend
1. Visit `https://your-frontend.onrender.com`
2. Should load without 502 error
3. Try registering a new account
4. Try logging in
5. Start a new analysis

### 3. Check Browser Console
- Open DevTools → Console
- Should see no errors
- Network tab should show API calls going to your backend URL

### 4. Monitor Render Logs
- Check both frontend and backend logs for any errors
- Look for successful startup messages

---

## 🔧 Troubleshooting

### Issue: 502 Bad Gateway on Frontend

**Possible Causes:**
1. Build failed - check Render logs for build errors
2. `NEXT_PUBLIC_API_URL` not set or incorrect
3. Application crashing at startup

**Solutions:**
1. Check Render logs for specific error messages
2. Verify environment variables are set correctly
3. Ensure build completes successfully locally: `cd frontend && npm run build`

### Issue: CORS Errors

**Cause:** Backend `CORS_ORIGINS` doesn't include frontend URL

**Solution:**
1. Go to backend service on Render
2. Update `CORS_ORIGINS` to include your frontend URL
3. Redeploy backend service

### Issue: "Cannot connect to backend"

**Cause:** `NEXT_PUBLIC_API_URL` not set or incorrect

**Solution:**
1. Go to frontend service on Render
2. Verify `NEXT_PUBLIC_API_URL` is set to your backend URL
3. Must include `/api/v1` at the end
4. Redeploy frontend service

### Issue: MongoDB Connection Failed

**Cause:** IP whitelist not configured

**Solution:**
1. Go to MongoDB Atlas → Network Access
2. Add IP address: `0.0.0.0/0` (allows all IPs)
3. Wait 2-3 minutes for changes to propagate

### Issue: Slow Initial Load

**Cause:** Free tier services spin down after inactivity

**Solution:**
- This is normal for free tier
- First request after spin-down takes 30-60 seconds
- Consider upgrading to paid tier for always-on services

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure:

- [ ] MongoDB Atlas IP whitelist set to `0.0.0.0/0`
- [ ] All API keys obtained (Claude, Firecrawl, Perplexity)
- [ ] Strong JWT_SECRET generated (32+ characters)
- [ ] Code pushed to GitHub repository
- [ ] Local build test passes: `cd frontend && npm run build`
- [ ] Backend health check works locally
- [ ] `.env` files not committed to git

---

## 🔐 Security Notes

### IP Whitelist (`0.0.0.0/0`)
- Required for Render's dynamic IP infrastructure
- Connection still secured by:
  - Username/password authentication
  - TLS/SSL encryption (enforced by MongoDB Atlas)
  - MongoDB Atlas's built-in security features

### Environment Variables
- Never commit `.env` files to git
- Use Render's environment variable management
- Rotate secrets regularly
- Use strong, unique passwords

### CORS Configuration
- Only allow your frontend domain
- Don't use wildcards (`*`) in production
- Update when changing frontend URL

---

## 📊 Expected Results

After successful deployment:

- ✅ Frontend loads without 502 error
- ✅ User registration works
- ✅ Login/logout works
- ✅ Analysis creation works
- ✅ API calls successfully reach backend
- ✅ No CORS errors
- ✅ MongoDB connection stable

---

## 🔄 Updating Your Deployment

### Code Changes
1. Push changes to GitHub
2. Render automatically detects and redeploys
3. Monitor deployment logs

### Environment Variable Changes
1. Update in Render dashboard
2. Manually trigger redeploy
3. Changes take effect immediately

### Database Changes
1. MongoDB Atlas changes are immediate
2. No redeploy needed
3. May need to restart services if connection issues

---

## 💰 Cost Considerations

### Free Tier Limitations
- Services spin down after 15 minutes of inactivity
- 750 hours/month of runtime per service
- Slower cold starts (30-60 seconds)

### Paid Tier Benefits ($7/month per service)
- Always-on services
- Faster performance
- No cold starts
- More resources

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [MongoDB Atlas Setup](https://www.mongodb.com/docs/atlas/getting-started/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)

---

## 🆘 Getting Help

If you encounter issues:

1. **Check Render Logs:**
   - Frontend service logs
   - Backend service logs
   - Look for specific error messages

2. **Verify Configuration:**
   - Double-check all environment variables
   - Ensure URLs are correct (no typos)
   - Verify API keys are valid

3. **Test Locally:**
   - Ensure everything works locally first
   - Run `npm run build` to test production build
   - Check backend health endpoint

4. **Common Issues:**
   - See Troubleshooting section above
   - Check `RENDER_502_TROUBLESHOOTING.md` for detailed 502 error guide

---

**Last Updated:** 2026-01-08  
**Status:** Ready for deployment ✅  
**Build Status:** Fixed and tested ✅