# Setup Guide - Demand Letter Generator

## Initial Setup (First Time)

### 1. Prerequisites Installation

#### macOS (Using Homebrew)
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Install Python
brew install python@3.11

# Install PostgreSQL
brew install postgresql@15

# Install Redis
brew install redis

# Install Docker Desktop (optional, but recommended)
# Download from: https://www.docker.com/products/docker-desktop
```

#### Verify Installations
```bash
node --version    # Should be 18+
npm --version
python3 --version # Should be 3.11+
psql --version    # Should be 15+
redis-cli --version
```

### 2. Clone and Install Dependencies

```bash
# Navigate to project directory
cd "/Users/dohoonkim/GauntletAI/Demand Letter"

# Install Frontend dependencies
cd frontend
npm install
cd ..

# Install Backend dependencies
cd backend
npm install
cd ..

# Install AI Service dependencies
cd ai-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..
```

### 3. Start Database Services

#### Option A: Using Docker (Recommended)
```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Verify services are running
docker ps
# You should see: demand-letter-postgres and demand-letter-redis

# Check logs if needed
docker-compose logs -f
```

#### Option B: Using Local Services
```bash
# Start PostgreSQL
brew services start postgresql@15

# Start Redis
brew services start redis

# Verify
psql -U dev -d demand_letters  # Password: devpass
redis-cli ping  # Should return: PONG
```

### 4. Configure Environment Variables

```bash
# Backend - Create .env file
cd backend
cat > .env << 'EOF'
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://dev:devpass@localhost:5432/demand_letters
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
AWS_REGION=us-east-1
CORS_ORIGIN=http://localhost:5173
AI_SERVICE_URL=http://localhost:8000
EOF

# Frontend - Create .env file
cd ../frontend
cat > .env << 'EOF'
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
EOF

# AI Service - Create .env file
cd ../ai-service
cat > .env << 'EOF'
ANTHROPIC_API_KEY=your-anthropic-api-key-here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
PORT=8000
LOG_LEVEL=INFO
EOF

cd ..
```

**Important**: Update `ANTHROPIC_API_KEY` in `ai-service/.env` with your actual key.

### 5. Initialize Database

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Seed database with sample data
# npm run seed
```

### 6. Verify Setup

```bash
# Test backend
cd backend
npm run dev &
# Should see: 🚀 Server running on http://localhost:3000

# Test health endpoint
curl http://localhost:3000/health
# Should return: {"status":"ok",...}

# Test frontend
cd ../frontend
npm run dev &
# Should see: Local: http://localhost:5173/

# Open browser to http://localhost:5173
# You should see the Steno Demand Letter Generator homepage

# Stop servers
# Press Ctrl+C in each terminal
```

## Daily Development Workflow

### Starting Development

```bash
# Terminal 1 - Database services (if using Docker)
docker-compose up

# Terminal 2 - Backend
cd backend
npm run dev

# Terminal 3 - Frontend
cd frontend
npm run dev

# Terminal 4 - AI Service (when needed)
cd ai-service
source venv/bin/activate
python lambda_handler.py
```

### Stopping Development

```bash
# In each terminal, press Ctrl+C

# Stop Docker services
docker-compose down

# Or stop local services
brew services stop postgresql@15
brew services stop redis
```

## Common Tasks

### Database Migrations

```bash
cd backend

# Create a new migration
npx prisma migrate dev --name your_migration_name

# Apply migrations to production
npx prisma migrate deploy

# Reset database (DANGER - deletes all data)
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio
# Opens browser at http://localhost:5555
```

### Adding New Dependencies

```bash
# Frontend
cd frontend
npm install package-name

# Backend
cd backend
npm install package-name

# AI Service
cd ai-service
source venv/bin/activate
pip install package-name
pip freeze > requirements.txt
```

### Running Tests

```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
npm test

# AI Service tests
cd ai-service
source venv/bin/activate
pytest
```

### Code Formatting and Linting

```bash
# Frontend
cd frontend
npm run lint

# Backend
cd backend
npm run lint
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000 (backend)
lsof -i :3000
kill -9 <PID>

# Find process using port 5173 (frontend)
lsof -i :5173
kill -9 <PID>
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps  # or
brew services list

# Test connection
psql -U dev -h localhost -d demand_letters

# Reset database
cd backend
npx prisma migrate reset
```

### Redis Connection Issues

```bash
# Check if Redis is running
redis-cli ping

# Restart Redis
docker-compose restart redis  # or
brew services restart redis
```

### Node Modules Issues

```bash
# Clear and reinstall
cd frontend  # or cd backend
rm -rf node_modules package-lock.json
npm install
```

### Python Environment Issues

```bash
cd ai-service
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Prisma Client Out of Sync

```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

## AWS Setup (For S3 and Production)

### 1. Install AWS CLI

```bash
brew install awscli

# Configure AWS credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region (us-east-1), Output (json)
```

### 2. Create S3 Bucket

```bash
# Create bucket
aws s3 mb s3://demand-letters-pdfs --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket demand-letters-pdfs \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket demand-letters-pdfs \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'
```

### 3. Update Environment Variables

Update `backend/.env`:
```bash
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=demand-letters-pdfs
S3_BUCKET_REGION=us-east-1
```

## Anthropic API Setup

### 1. Get API Key

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to API Keys
4. Create new key

### 2. Update Environment Variables

Update `ai-service/.env`:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...your-key-here
```

### 3. Test API Connection

```bash
cd ai-service
source venv/bin/activate
python -c "import anthropic; print('API key valid')"
```

## Next Steps

Once setup is complete, you're ready to start development:

1. **Review Memory Bank**: Read `/memory-bank/` for project context
2. **Check Progress**: See `/memory-bank/progress.md` for current status
3. **Read Code Standards**: Review `.cursor/rules/base.mdc`
4. **Start Milestone 1**: Begin implementing infrastructure and storage

## Getting Help

- **Documentation**: `/memory-bank/` directory
- **API Reference**: `/backend/docs/` (coming soon)
- **Architecture**: `/memory-bank/systemPatterns.md`
- **Troubleshooting**: See above or README.md

---

**Setup Complete!** 🎉

You're now ready to build the Demand Letter Generator.

