# Heroku Deployment Guide

Complete guide to deploy the Steno Demand Letter Generator to Heroku.

---

## 📋 Prerequisites

```bash
# 1. Heroku account (https://signup.heroku.com/)
# 2. Heroku CLI installed
# 3. Git repository
# 4. AWS S3 bucket created
# 5. Anthropic API key
```

---

## 🚀 Step 1: Install Heroku CLI

```bash
# macOS
brew tap heroku/brew && brew install heroku

# Or download from: https://devcenter.heroku.com/articles/heroku-cli

# Verify installation
heroku --version

# Login
heroku login
# Press any key to open browser and login
```

---

## 📦 Step 2: Prepare Backend for Heroku

### Create `backend/Procfile`

```bash
cd "/Users/dohoonkim/GauntletAI/Demand Letter/backend"
cat > Procfile << 'EOF'
web: npx prisma migrate deploy && npm run start
EOF
```

### Create `backend/package.json` scripts (if not exist)

Check that your `backend/package.json` has:

```json
{
  "scripts": {
    "start": "node dist/server.js",
    "build": "tsc",
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts"
  },
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  }
}
```

---

## 🐍 Step 3: Prepare AI Service for Heroku

### Create `ai-service/Procfile`

```bash
cd "/Users/dohoonkim/GauntletAI/Demand Letter/ai-service"
cat > Procfile << 'EOF'
web: uvicorn src.main:app --host 0.0.0.0 --port $PORT
EOF
```

### Create `ai-service/runtime.txt`

```bash
cat > runtime.txt << 'EOF'
python-3.11.7
EOF
```

---

## 🌐 Step 4: Deploy Backend

```bash
cd "/Users/dohoonkim/GauntletAI/Demand Letter"

# Create Heroku app for backend
heroku create steno-backend --region us

# This creates a git remote named 'heroku'
# URL will be: https://steno-backend-xxxxx.herokuapp.com
```

### Add PostgreSQL Database

```bash
# Add Postgres addon (free tier)
heroku addons:create heroku-postgresql:essential-0 --app steno-backend

# This automatically sets DATABASE_URL environment variable
# Verify:
heroku config:get DATABASE_URL --app steno-backend
```

### Set Environment Variables

```bash
# Generate JWT secrets
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Set backend environment variables
heroku config:set \
  NODE_ENV=production \
  JWT_SECRET="$JWT_SECRET" \
  JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET" \
  AWS_REGION=us-east-1 \
  AWS_ACCESS_KEY_ID=your-aws-access-key \
  AWS_SECRET_ACCESS_KEY=your-aws-secret-key \
  S3_BUCKET_NAME=your-bucket-name \
  AI_SERVICE_URL=https://steno-ai-service.herokuapp.com \
  FRONTEND_URL=https://steno-frontend.herokuapp.com \
  --app steno-backend

# Replace 'your-aws-access-key', 'your-aws-secret-key', 'your-bucket-name' with actual values
```

### Deploy Backend

Since we're in a monorepo, we need to use subdirectory deployment:

```bash
# Method 1: Using git subtree (Recommended)
git subtree push --prefix backend heroku main

# If git subtree doesn't work, use Method 2
```

**Method 2: Create separate git for backend**

```bash
# Create temporary directory
cd backend
git init
git add .
git commit -m "Initial backend deploy"

# Add Heroku remote
heroku git:remote --app steno-backend

# Push
git push heroku main

# Clean up (optional)
cd ..
```

### Run Database Migrations

```bash
# Migrations run automatically via Procfile
# But you can also run manually:
heroku run npx prisma migrate deploy --app steno-backend

# Seed database (optional)
heroku run npm run seed --app steno-backend
```

### Verify Backend

```bash
# Check logs
heroku logs --tail --app steno-backend

# Test health endpoint
curl https://steno-backend.herokuapp.com/health
```

---

## 🤖 Step 5: Deploy AI Service

```bash
cd "/Users/dohoonkim/GauntletAI/Demand Letter"

# Create Heroku app for AI service
heroku create steno-ai-service --region us
```

### Set Environment Variables

```bash
heroku config:set \
  ANTHROPIC_API_KEY=sk-ant-api03-YOUR-KEY-HERE \
  ANTHROPIC_MODEL=claude-haiku-4-5-20251001 \
  AWS_REGION=us-east-1 \
  AWS_ACCESS_KEY_ID=your-aws-access-key \
  AWS_SECRET_ACCESS_KEY=your-aws-secret-key \
  S3_BUCKET_NAME=your-bucket-name \
  --app steno-ai-service
```

### Deploy AI Service

```bash
# Method 1: Using git subtree
git subtree push --prefix ai-service heroku main

# Method 2: Separate git (if subtree doesn't work)
cd ai-service
git init
git add .
git commit -m "Initial AI service deploy"
heroku git:remote --app steno-ai-service
git push heroku main
cd ..
```

### Verify AI Service

```bash
# Check logs
heroku logs --tail --app steno-ai-service

# Test health endpoint
curl https://steno-ai-service.herokuapp.com/health
```

---

## 🎨 Step 6: Deploy Frontend (Option A: Heroku)

### Create `frontend/static.json`

```bash
cd "/Users/dohoonkim/GauntletAI/Demand Letter/frontend"
cat > static.json << 'EOF'
{
  "root": "dist",
  "clean_urls": true,
  "routes": {
    "/**": "index.html"
  },
  "headers": {
    "/**": {
      "Cache-Control": "public, max-age=0, must-revalidate",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block"
    },
    "/assets/**": {
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  }
}
EOF
```

### Create `frontend/package.json` adjustments

Add to your `frontend/package.json`:

```json
{
  "scripts": {
    "start": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "heroku-postbuild": "npm run build"
  },
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  }
}
```

### Add Heroku buildpack for static sites

```bash
cd "/Users/dohoonkim/GauntletAI/Demand Letter"

# Create Heroku app for frontend
heroku create steno-frontend --region us

# Add Node.js buildpack
heroku buildpacks:add heroku/nodejs --app steno-frontend

# Add static buildpack
heroku buildpacks:add https://github.com/heroku/heroku-buildpack-static --app steno-frontend
```

### Set Environment Variables

```bash
heroku config:set \
  VITE_API_URL=https://steno-backend.herokuapp.com \
  --app steno-frontend
```

### Deploy Frontend

```bash
# Method 1: Using git subtree
git subtree push --prefix frontend heroku main

# Method 2: Separate git
cd frontend
git init
git add .
git commit -m "Initial frontend deploy"
heroku git:remote --app steno-frontend
git push heroku main
cd ..
```

---

## 🎨 Step 6: Deploy Frontend (Option B: Vercel - Recommended)

Heroku's static hosting is expensive. Better to use Vercel for frontend:

```bash
cd frontend

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# When prompted:
# ? Set up and deploy "frontend"? Yes
# ? Which scope? (Your account)
# ? Link to existing project? No
# ? What's your project's name? steno-frontend
# ? In which directory is your code located? ./

# Set environment variable in Vercel dashboard
# VITE_API_URL=https://steno-backend.herokuapp.com
```

Then update backend CORS:

```bash
heroku config:set \
  FRONTEND_URL=https://steno-frontend.vercel.app \
  --app steno-backend
```

---

## 🔄 Step 7: Update Cross-Service URLs

Now that all services are deployed, update URLs:

```bash
# Update backend with AI service URL
heroku config:set \
  AI_SERVICE_URL=https://steno-ai-service.herokuapp.com \
  --app steno-backend

# Update backend with frontend URL (if using Heroku for frontend)
heroku config:set \
  FRONTEND_URL=https://steno-frontend.herokuapp.com \
  --app steno-backend

# Or if using Vercel:
heroku config:set \
  FRONTEND_URL=https://steno-frontend.vercel.app \
  --app steno-backend

# Restart backend to pick up changes
heroku restart --app steno-backend
```

---

## ✅ Step 8: Verify Deployment

### Test Backend

```bash
# Health check
curl https://steno-backend.herokuapp.com/health

# Should return:
# {"status":"ok","timestamp":"..."}
```

### Test AI Service

```bash
# Health check
curl https://steno-ai-service.herokuapp.com/health

# Should return:
# {"status":"healthy"}
```

### Test Full Application

1. **Open frontend**: https://steno-frontend.herokuapp.com (or Vercel URL)
2. **Register account**: Create a new user
3. **Create document**: Click "New Document"
4. **Upload PDF**: Upload a sample PDF
5. **Extract facts**: Click "Extract Facts with AI"
6. **Approve facts**: Review and approve facts
7. **Generate draft**: Click "Generate Demand Letter Draft"
8. **Export**: Click "Export to Word"

---

## 🔍 Monitoring & Debugging

### View Logs

```bash
# Backend logs
heroku logs --tail --app steno-backend

# AI service logs
heroku logs --tail --app steno-ai-service

# Frontend logs (if on Heroku)
heroku logs --tail --app steno-frontend

# View specific error
heroku logs --tail --app steno-backend | grep ERROR
```

### Access Database

```bash
# Open database console
heroku pg:psql --app steno-backend

# View tables
\dt

# Query users
SELECT * FROM "User";

# Exit
\q
```

### Run Commands

```bash
# Run Prisma Studio (database GUI)
heroku run npx prisma studio --app steno-backend

# Run migrations
heroku run npx prisma migrate deploy --app steno-backend

# Seed database
heroku run npm run seed --app steno-backend

# Check environment variables
heroku config --app steno-backend
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Backend won't start - "Port already in use"

**Cause**: Not using Heroku's dynamic port

**Fix**: In `backend/src/server.ts`, ensure:

```typescript
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Issue 2: Prisma migrations fail

**Cause**: Missing Prisma generate step

**Fix**: Update `backend/Procfile`:

```
web: npx prisma generate && npx prisma migrate deploy && npm run start
```

### Issue 3: Frontend can't reach backend - CORS error

**Cause**: CORS not configured for Heroku domain

**Fix**:

```bash
heroku config:set \
  FRONTEND_URL=https://steno-frontend.herokuapp.com \
  --app steno-backend

heroku restart --app steno-backend
```

### Issue 4: AI service timeout

**Cause**: Heroku has 30-second request timeout

**Fix**: For long-running AI operations, implement async processing:
1. Return job ID immediately
2. Process in background
3. Poll for completion

Or upgrade to Heroku Performance dyno (timeout: 55 seconds)

### Issue 5: Database connection limit reached

**Cause**: Heroku Postgres free tier has 20 connection limit

**Fix**: Update Prisma connection pooling:

```prisma
// backend/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Add connection pool settings
  relationMode = "prisma"
}
```

And in connection string:
```bash
DATABASE_URL="postgresql://...?connection_limit=5&pool_timeout=10"
```

### Issue 6: "App crashed" error

**Solution**:

```bash
# Check logs
heroku logs --tail --app steno-backend

# Common causes:
# 1. Missing environment variable
heroku config --app steno-backend

# 2. Port binding issue (see Issue 1)

# 3. Build failure
heroku builds --app steno-backend
heroku builds:output <build-id> --app steno-backend

# Restart app
heroku restart --app steno-backend
```

---

## 🔄 Continuous Deployment

### Set up automatic deploys from GitHub

1. Go to Heroku Dashboard
2. Select your app (e.g., steno-backend)
3. Click **"Deploy"** tab
4. Under **"Deployment method"**, click **"GitHub"**
5. Connect your GitHub account
6. Search for repository: `demand-letter-generator`
7. Click **"Connect"**
8. Enable **"Automatic deploys"** from `main` branch
9. Click **"Enable Automatic Deploys"**

**Now**: Every push to `main` will auto-deploy! 🎉

---

## 💰 Cost Breakdown (Heroku)

### Eco Dynos Plan (Recommended for MVP)

| Service | Dyno Type | Cost |
|---------|-----------|------|
| Backend | Eco | $5/month |
| AI Service | Eco | $5/month |
| Frontend* | Eco | $5/month |
| PostgreSQL | Essential-0 | $5/month |
| **Total** | | **$20/month** |

*If using Vercel for frontend: **$15/month** (Backend + AI + DB)

### Production Plan

| Service | Dyno Type | Cost |
|---------|-----------|------|
| Backend | Standard-1X | $25/month |
| AI Service | Standard-2X | $50/month |
| PostgreSQL | Standard-0 | $50/month |
| **Total** | | **$125/month** |

### Add-ons (Optional)

- **Redis**: $15/month (for caching)
- **Papertrail**: $7/month (advanced logging)
- **New Relic**: Free tier (monitoring)

---

## 🚀 Scaling Tips

### Scale dynos

```bash
# Scale backend to 2 web dynos
heroku ps:scale web=2 --app steno-backend

# Upgrade to Standard dyno (better performance)
heroku dyno:type standard-1x --app steno-backend
```

### Add Redis caching

```bash
# Add Redis addon
heroku addons:create heroku-redis:mini --app steno-backend

# This sets REDIS_URL automatically
heroku config:get REDIS_URL --app steno-backend
```

### Enable Metrics

```bash
# View metrics in dashboard
heroku labs:enable runtime-dyno-metadata --app steno-backend
```

---

## 📊 Environment Variables Reference

### Backend (steno-backend)

```bash
NODE_ENV=production
DATABASE_URL=<auto-set-by-heroku>
JWT_SECRET=<generated>
JWT_REFRESH_SECRET=<generated>
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-aws-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret>
S3_BUCKET_NAME=<your-bucket>
AI_SERVICE_URL=https://steno-ai-service.herokuapp.com
FRONTEND_URL=https://steno-frontend.vercel.app
```

### AI Service (steno-ai-service)

```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-aws-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret>
S3_BUCKET_NAME=<your-bucket>
```

### Frontend (steno-frontend or Vercel)

```bash
VITE_API_URL=https://steno-backend.herokuapp.com
```

---

## 🔒 Security Checklist

Before going live:

- [ ] All environment variables set (no hardcoded secrets)
- [ ] HTTPS enabled (Heroku does this automatically)
- [ ] CORS configured correctly
- [ ] JWT secrets are strong (64+ characters)
- [ ] Database backups enabled
- [ ] Error logging configured
- [ ] Rate limiting enabled
- [ ] Security headers configured

---

## 📝 Post-Deployment Tasks

1. **Set up monitoring**
   ```bash
   heroku addons:create newrelic:wayne --app steno-backend
   ```

2. **Enable daily backups**
   ```bash
   heroku pg:backups:schedule --at '02:00 America/Los_Angeles' --app steno-backend
   ```

3. **Set up custom domain** (optional)
   ```bash
   heroku domains:add steno.yourdomain.com --app steno-backend
   ```

4. **Configure alerting**
   - Set up Heroku dashboard notifications
   - Connect to Slack/email for crash alerts

---

## 🎯 Quick Deploy Commands (Summary)

```bash
# 1. Create apps
heroku create steno-backend --region us
heroku create steno-ai-service --region us

# 2. Add database
heroku addons:create heroku-postgresql:essential-0 --app steno-backend

# 3. Set environment variables (replace with your values)
heroku config:set JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")" --app steno-backend
heroku config:set JWT_REFRESH_SECRET="$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")" --app steno-backend
heroku config:set AWS_ACCESS_KEY_ID=your-key AWS_SECRET_ACCESS_KEY=your-secret S3_BUCKET_NAME=your-bucket --app steno-backend
heroku config:set ANTHROPIC_API_KEY=your-key --app steno-ai-service
heroku config:set AI_SERVICE_URL=https://steno-ai-service.herokuapp.com FRONTEND_URL=https://steno-frontend.vercel.app --app steno-backend

# 4. Deploy (from project root)
git subtree push --prefix backend heroku main  # Backend
git subtree push --prefix ai-service heroku main  # AI Service

# 5. Deploy frontend to Vercel
cd frontend && vercel --prod

# 6. Verify
curl https://steno-backend.herokuapp.com/health
curl https://steno-ai-service.herokuapp.com/health
```

---

## 🆘 Support

**Heroku Documentation**: https://devcenter.heroku.com/  
**Status Page**: https://status.heroku.com/  
**Support**: https://help.heroku.com/

---

**Last Updated**: January 15, 2025  
**Heroku Version**: Cedar-22 Stack

