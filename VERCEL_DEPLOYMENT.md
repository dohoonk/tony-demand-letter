# Vercel Deployment Guide - Frontend

Complete guide to deploy the Demand Letter Generator frontend to Vercel.

---

## 📋 Prerequisites

- Vercel account (https://vercel.com/signup)
- Backend deployed to Heroku (with URL)
- Git repository pushed to GitHub (recommended) or GitLab/Bitbucket

---

## 🚀 Method 1: Deploy via Vercel Dashboard (Recommended)

### Step 1: Connect Repository

1. Go to https://vercel.com/
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository
   - If not connected, click **"Connect Git Provider"**
   - Select GitHub/GitLab/Bitbucket
   - Authorize Vercel access
4. Search for your repository: `Demand Letter`
5. Click **"Import"**

### Step 2: Configure Project

When configuring the project:

1. **Framework Preset**: Vite (should auto-detect)
2. **Root Directory**: `frontend`
   - Click **"Edit"** next to Root Directory
   - Enter: `frontend`
   - This tells Vercel to build from the frontend folder
3. **Build and Output Settings**:
   - Build Command: `npm run build` (default, should be auto-filled)
   - Output Directory: `dist` (default, should be auto-filled)
   - Install Command: `npm install` (default)

### Step 3: Set Environment Variables

In the **"Environment Variables"** section:

1. Click **"Add Environment Variable"**
2. Add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend-app.herokuapp.com`
   - Replace with your actual Heroku backend URL (without trailing slash)
3. Leave environment set to: **Production**, **Preview**, and **Development**

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait 1-2 minutes for build to complete
3. Once deployed, you'll see:
   - ✅ **Production URL**: `https://your-project.vercel.app`
   - You can click to visit the site

### Step 5: Update Backend CORS

Now that your frontend is deployed, update your Heroku backend to allow requests:

```bash
# Update backend environment variable
heroku config:set \
  FRONTEND_URL=https://your-project.vercel.app \
  --app your-backend-app

# Restart backend
heroku restart --app your-backend-app
```

Replace:
- `your-project.vercel.app` with your actual Vercel URL
- `your-backend-app` with your Heroku app name

---

## 🚀 Method 2: Deploy via Vercel CLI

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

This will open your browser for authentication.

### Step 3: Deploy

```bash
cd "/Users/dohoonkim/GauntletAI/Demand Letter/frontend"

# For production deployment
vercel --prod
```

### Step 4: Answer Prompts

When prompted:

```
? Set up and deploy "frontend"? [Y/n] Y
? Which scope? (Select your account)
? Link to existing project? [y/N] N
? What's your project's name? demand-letter-frontend
? In which directory is your code located? ./
```

### Step 5: Set Environment Variable

```bash
# Set production environment variable
vercel env add VITE_API_URL production

# When prompted, enter:
# https://your-backend-app.herokuapp.com
```

Or via Vercel dashboard:
1. Go to your project dashboard
2. Click **"Settings"** → **"Environment Variables"**
3. Add `VITE_API_URL` with your Heroku backend URL

### Step 6: Redeploy with Environment Variable

```bash
vercel --prod
```

---

## ✅ Verify Deployment

### 1. Test Frontend Access

Visit your Vercel URL: `https://your-project.vercel.app`

You should see:
- ✅ Login/Register page loads
- ✅ No console errors in browser DevTools
- ✅ UI renders correctly

### 2. Test Backend Connection

Try to register/login:
1. Click **"Register"**
2. Fill in form
3. Submit

If successful:
- ✅ You're redirected to dashboard
- ✅ Token is saved (check localStorage in DevTools)

If you see CORS errors:
- ❌ Check that `FRONTEND_URL` is set correctly on Heroku backend
- ❌ Restart Heroku backend: `heroku restart --app your-backend-app`

### 3. Test WebSocket Connection

Open browser DevTools console, you should see:
```
✅ WebSocket connected: <socket-id>
```

If you see connection errors:
- Check that `VITE_API_URL` is set correctly
- Ensure Heroku backend supports WebSocket connections

---

## 🔄 Continuous Deployment

### Automatic Deploys from Git

Vercel automatically deploys when you push to your repository:

1. **Production**: Pushes to `main` branch
2. **Preview**: Pushes to other branches (e.g., `dev`, `feature/*`)

To disable auto-deploy:
1. Go to project dashboard
2. **Settings** → **Git**
3. Toggle **"Production Branch"** or **"Preview Deployments"**

---

## 🌐 Custom Domain (Optional)

### Add Your Own Domain

1. Go to project dashboard
2. Click **"Settings"** → **"Domains"**
3. Click **"Add"**
4. Enter your domain: `app.yourdomain.com`
5. Follow DNS configuration instructions
6. Wait for DNS propagation (5-30 minutes)

### Update Backend CORS

```bash
heroku config:set \
  FRONTEND_URL=https://app.yourdomain.com \
  --app your-backend-app
```

---

## 🐛 Troubleshooting

### Issue 1: Build Fails - "Cannot find module"

**Cause**: Missing dependencies

**Fix**:
```bash
cd frontend
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

### Issue 2: API Requests Fail - "Network Error"

**Cause**: `VITE_API_URL` not set or incorrect

**Fix**:
1. Go to Vercel dashboard → **Settings** → **Environment Variables**
2. Verify `VITE_API_URL` is set correctly (no trailing slash)
3. Redeploy: Click **"Deployments"** → Latest deployment → **"Redeploy"**

### Issue 3: CORS Error in Browser

**Cause**: Backend not configured for Vercel domain

**Fix**:
```bash
# Check backend environment variables
heroku config --app your-backend-app

# Should see FRONTEND_URL set to your Vercel URL
# If not, set it:
heroku config:set FRONTEND_URL=https://your-project.vercel.app --app your-backend-app
heroku restart --app your-backend-app
```

### Issue 4: WebSocket Connection Fails

**Cause**: Backend WebSocket not configured properly

**Symptoms**: Console shows "WebSocket connection error"

**Fix**:
1. Ensure backend supports WebSocket connections
2. Check that Socket.IO is configured for CORS
3. Verify `transports: ['websocket', 'polling']` in socketService.ts

### Issue 5: Environment Variables Not Applied

**Cause**: Environment variables are baked into build, not runtime

**Fix**:
1. Update environment variable in Vercel dashboard
2. **Redeploy** the project (environment changes require rebuild)
3. Go to **Deployments** → Latest → **"Redeploy"**

### Issue 6: 404 on Page Refresh

**Cause**: Missing rewrite rules for SPA routing

**Fix**: Already handled by `vercel.json` in this project

If issue persists, verify `vercel.json` exists with:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 📊 Environment Variables Reference

### Frontend (Vercel)

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_URL` | `https://your-backend-app.herokuapp.com` | Backend API base URL (no trailing slash) |

**Note**: Vite only exposes variables prefixed with `VITE_` to the frontend.

---

## 🔍 Monitoring & Analytics

### View Deployment Logs

1. Go to Vercel dashboard
2. Click **"Deployments"**
3. Click on any deployment
4. View **"Building"** and **"Build Logs"**

### View Runtime Logs

1. Go to project dashboard
2. Click **"Logs"** tab
3. View real-time function logs (for API routes, if any)

### Analytics (Optional)

Vercel offers built-in analytics:
1. Go to project dashboard
2. Click **"Analytics"** tab
3. Enable **Vercel Analytics** (free tier available)
4. Add to your app (optional):

```bash
npm install @vercel/analytics
```

```typescript
// src/main.tsx
import { inject } from '@vercel/analytics'
inject()
```

---

## 💰 Cost

### Free Tier (Hobby)
- **Price**: $0/month
- **Bandwidth**: 100 GB/month
- **Deployments**: Unlimited
- **Build minutes**: Unlimited
- **Custom domains**: Unlimited
- **Limitations**: Personal/hobby projects only

### Pro Tier
- **Price**: $20/month per user
- Everything in Hobby +
- **Bandwidth**: 1 TB/month
- Team collaboration
- Advanced analytics
- Priority support
- Commercial use allowed

**For this project**: Free tier is perfect for MVP/testing! 🎉

---

## 🚀 Quick Deploy Summary

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install Vercel CLI (if not already)
npm install -g vercel

# 3. Login
vercel login

# 4. Deploy to production
vercel --prod

# 5. Set environment variable (via CLI or dashboard)
# VITE_API_URL=https://your-backend-app.herokuapp.com

# 6. Update backend CORS
heroku config:set FRONTEND_URL=https://your-project.vercel.app --app your-backend-app

# 7. Done! 🎉
```

---

## 🔗 Useful Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Documentation**: https://vercel.com/docs
- **Vite on Vercel**: https://vercel.com/docs/frameworks/vite
- **Environment Variables**: https://vercel.com/docs/concepts/projects/environment-variables

---

## 📝 Post-Deployment Checklist

- [ ] Frontend deployed and accessible
- [ ] `VITE_API_URL` environment variable set
- [ ] Backend `FRONTEND_URL` updated with Vercel URL
- [ ] CORS working (no errors in console)
- [ ] WebSocket connection working
- [ ] User can register/login
- [ ] Documents load correctly
- [ ] All features working end-to-end
- [ ] Custom domain configured (optional)
- [ ] Automatic deploys enabled (optional)

---

**Last Updated**: January 15, 2025  
**Vercel CLI Version**: Latest


