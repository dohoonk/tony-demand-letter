# Credentials Setup Guide

This guide explains how to obtain and configure all required credentials for the Demand Letter Generator.

## 🔑 Required Services

1. **Database** (PostgreSQL) - Local via Docker
2. **Cache** (Redis) - Local via Docker
3. **AI** (Anthropic API) - Requires API key
4. **Storage** (AWS S3) - Requires AWS account
5. **Authentication** (JWT) - Generate your own secrets

---

## 1. Database & Cache (Docker) ✅

**Already configured!** Just run:

```bash
docker-compose up -d
```

This starts PostgreSQL and Redis with these default credentials:
- **PostgreSQL**: `dev:devpass@localhost:5432/demand_letters`
- **Redis**: `localhost:6379` (no password)

---

## 2. Anthropic API Key 🤖

### Get Your API Key:

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to **API Keys**
4. Click **"Create Key"**
5. Copy your key (starts with `sk-ant-api03-...`)

### Configure:

Edit `ai-service/.env`:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-YOUR-ACTUAL-KEY-HERE
```

### Pricing:
- Claude 3.5 Sonnet: ~$3 per million input tokens
- Estimated cost per demand letter: $0.10-0.50
- Get $5 free credit to start

---

## 3. AWS S3 Setup ☁️

### Option A: Use AWS S3 (Recommended for Production)

1. **Create AWS Account**: https://aws.amazon.com/
2. **Create IAM User**:
   ```
   - Go to IAM → Users → Add User
   - Enable "Programmatic access"
   - Attach policy: AmazonS3FullAccess
   - Save Access Key ID and Secret Access Key
   ```

3. **Create S3 Bucket**:
   ```bash
   aws s3 mb s3://demand-letters-pdfs-yourname --region us-east-1
   
   # Enable encryption
   aws s3api put-bucket-encryption \
     --bucket demand-letters-pdfs-yourname \
     --server-side-encryption-configuration '{
       "Rules": [{
         "ApplyServerSideEncryptionByDefault": {
           "SSEAlgorithm": "AES256"
         }
       }]
     }'
   ```

4. **Configure** `backend/.env` and `ai-service/.env`:
   ```bash
   AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXX
   AWS_SECRET_ACCESS_KEY=your-secret-key
   S3_BUCKET_NAME=demand-letters-pdfs-yourname
   AWS_REGION=us-east-1
   ```

### Option B: Local Development (MinIO)

For local development without AWS:

```bash
# Install MinIO
brew install minio/stable/minio

# Start MinIO
minio server ~/minio-data

# Access console at http://localhost:9000
# Default: minioadmin / minioadmin
```

Update `.env` files:
```bash
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET_NAME=demand-letters
AWS_REGION=us-east-1
# Add custom endpoint in code if needed
```

---

## 4. JWT Secrets 🔐

Generate strong random secrets for JWT tokens:

### On macOS/Linux:
```bash
# Generate JWT secret
openssl rand -base64 32

# Generate refresh secret
openssl rand -base64 32
```

### Or use Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Configure `backend/.env`:
```bash
JWT_SECRET=<paste-first-generated-secret>
JWT_REFRESH_SECRET=<paste-second-generated-secret>
```

---

## 📋 Complete Configuration Checklist

### Backend (backend/.env):
- [x] NODE_ENV=development
- [x] PORT=3000
- [x] DATABASE_URL (from Docker)
- [x] REDIS_URL (from Docker)
- [ ] JWT_SECRET (generate new)
- [ ] JWT_REFRESH_SECRET (generate new)
- [ ] AWS_ACCESS_KEY_ID (from AWS IAM)
- [ ] AWS_SECRET_ACCESS_KEY (from AWS IAM)
- [ ] S3_BUCKET_NAME (your bucket name)
- [x] CORS_ORIGIN=http://localhost:5173

### Frontend (frontend/.env):
- [x] VITE_API_URL=http://localhost:3000
- [x] VITE_WS_URL=ws://localhost:3000

### AI Service (ai-service/.env):
- [ ] ANTHROPIC_API_KEY (from Anthropic Console)
- [x] ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
- [ ] AWS_ACCESS_KEY_ID (same as backend)
- [ ] AWS_SECRET_ACCESS_KEY (same as backend)
- [ ] S3_BUCKET_NAME (same as backend)
- [x] DATABASE_URL (same as backend)

---

## 🚀 Quick Start (Minimal Setup)

**Want to test without AWS S3?** You can comment out S3 operations temporarily:

1. Get Anthropic API key (required for AI features)
2. Generate JWT secrets (required for auth)
3. Start Docker services (required for database)
4. Use dummy AWS credentials (uploads will fail but you can test other features)

Then run:
```bash
cd backend && npm run dev
cd frontend && npm run dev
cd ai-service && python lambda_handler.py
```

---

## 🔒 Security Best Practices

1. **Never commit `.env` files** (already in `.gitignore`)
2. **Use different secrets** for development and production
3. **Rotate keys** periodically (every 90 days)
4. **Use AWS IAM roles** in production instead of keys
5. **Enable MFA** on AWS account
6. **Monitor API usage** on Anthropic Console

---

## 💰 Cost Estimates

### Development (per month):
- AWS S3: ~$1-5 (storage + requests)
- Anthropic API: ~$10-50 (depending on usage)
- PostgreSQL: $0 (Docker local)
- Redis: $0 (Docker local)

### Production (per month):
- AWS S3: ~$10-50
- Anthropic API: ~$50-200
- AWS RDS (Postgres): ~$15-100
- AWS ElastiCache (Redis): ~$15-100
- **Total**: ~$90-450/month

---

## 🆘 Troubleshooting

### "AWS credentials not found"
- Make sure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set in `.env`
- Run `aws configure` to test credentials

### "Anthropic API error"
- Check your API key starts with `sk-ant-api03-`
- Verify you have credits remaining in Anthropic Console
- Check rate limits (tier-dependent)

### "Database connection failed"
- Ensure Docker is running: `docker ps`
- Check DATABASE_URL matches Docker config
- Try `docker-compose restart postgres`

### "S3 bucket not found"
- Verify bucket exists: `aws s3 ls`
- Check bucket name and region match `.env`
- Ensure IAM user has S3 permissions

---

## 📞 Getting Help

- **Anthropic API Docs**: https://docs.anthropic.com/
- **AWS S3 Docs**: https://docs.aws.amazon.com/s3/
- **Project Issues**: Check Memory Bank documentation
- **Environment Variables**: See `.env.example` files

---

**After configuring all credentials, restart all services for changes to take effect!**

