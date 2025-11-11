# Steno Demand Letter Generator

AI-powered demand letter drafting workspace for law firms.

## Project Overview

The Demand Letter Generator streamlines litigation workflows by:
- **Extracting** facts from case PDFs with AI
- **Validating** facts through human review
- **Generating** professional drafts using firm templates
- **Enabling** real-time collaborative editing
- **Exporting** to DOCX with firm letterhead

**Target**: Reduce drafting time by 50%+ while maintaining professional consistency.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   React     │────▶│   Node.js    │────▶│  Python AI  │
│  Frontend   │     │   Backend    │     │   Lambda    │
└─────────────┘     └──────┬───────┘     └─────────────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
         ┌────────┐  ┌────────┐  ┌──────┐
         │Postgres│  │ Redis  │  │  S3  │
         └────────┘  └────────┘  └──────┘
```

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + TipTap
- **Backend**: Node.js + Express + TypeScript + Prisma
- **AI Service**: Python 3.11 + Anthropic API + AWS Lambda
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Storage**: AWS S3
- **Real-time**: Y.js + WebSockets

## Project Structure

```
demand-letter/
├── frontend/              # React application
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Route pages
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API clients
│   │   ├── types/        # TypeScript types
│   │   ├── utils/        # Helper functions
│   │   └── styles/       # CSS/Tailwind
│   ├── package.json
│   └── vite.config.ts
│
├── backend/              # Node.js API server
│   ├── src/
│   │   ├── controllers/  # Route handlers
│   │   ├── services/     # Business logic
│   │   ├── repositories/ # Data access
│   │   ├── middleware/   # Express middleware
│   │   ├── models/       # Prisma models
│   │   ├── routes/       # API routes
│   │   ├── config/       # Configuration
│   │   └── types/        # TypeScript types
│   ├── prisma/
│   │   └── schema.prisma
│   ├── package.json
│   └── tsconfig.json
│
├── ai-service/           # Python AI service
│   ├── src/
│   │   ├── handlers/     # Lambda handlers
│   │   ├── services/     # AI logic
│   │   ├── models/       # Pydantic models
│   │   └── utils/        # Helper functions
│   ├── requirements.txt
│   └── lambda_handler.py
│
├── shared/               # Shared TypeScript types
│   └── types/
│
├── memory-bank/          # Project documentation
│   ├── projectbrief.md
│   ├── productContext.md
│   ├── systemPatterns.md
│   ├── techContext.md
│   ├── activeContext.md
│   └── progress.md
│
├── .cursor/              # Cursor AI rules
│   └── rules/
│       └── base.mdc
│
├── docker-compose.yml    # Local services
└── README.md
```

## Quick Start

### Prerequisites

```bash
# Required
- Node.js 18+ (https://nodejs.org/)
- Python 3.11+ (https://www.python.org/)
- PostgreSQL 15+ (https://www.postgresql.org/)
- Redis 7+ (https://redis.io/)
- AWS CLI (https://aws.amazon.com/cli/)

# Recommended
- nvm (Node version manager)
- pyenv (Python version manager)
- Docker Desktop (for local Postgres + Redis)
```

### 1. Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd "Demand Letter"

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install

# Install AI service dependencies
cd ../ai-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Set Up Local Services (Docker)

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Verify services are running
docker ps
```

### 3. Configure Environment Variables

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your values

# Frontend
cd ../frontend
cp .env.example .env
# Edit .env with your values

# AI Service
cd ../ai-service
cp .env.example .env
# Edit .env with your Anthropic API key
```

### 4. Initialize Database

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npm run seed
```

### 5. Run Development Servers

**Terminal 1 - Backend**:
```bash
cd backend
npm run dev
# Server runs on http://localhost:3000
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
# App runs on http://localhost:5173
```

**Terminal 3 - AI Service** (optional for local development):
```bash
cd ai-service
source venv/bin/activate
python lambda_handler.py
# Service runs on http://localhost:8000
```

### 6. Verify Setup

Open browser to `http://localhost:5173`

- [ ] Frontend loads without errors
- [ ] Can register new user
- [ ] Can login and see dashboard
- [ ] Backend API responds at http://localhost:3000/health

## Development Workflow

### Making Changes

1. **Create feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes** with hot reload active

3. **Run tests**:
   ```bash
   # Frontend
   cd frontend && npm test
   
   # Backend
   cd backend && npm test
   
   # AI Service
   cd ai-service && pytest
   ```

4. **Commit and push**:
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

### Database Migrations

```bash
cd backend

# Create new migration
npx prisma migrate dev --name your_migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (DANGER - deletes all data)
npx prisma migrate reset
```

### Adding Dependencies

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

## API Documentation

### Authentication
```
POST   /api/auth/register  - Register new user
POST   /api/auth/login     - Login
POST   /api/auth/refresh   - Refresh access token
POST   /api/auth/logout    - Logout
GET    /api/auth/me        - Get current user
```

### Documents
```
GET    /api/documents           - List all documents
POST   /api/documents           - Create document
GET    /api/documents/:id       - Get document
PATCH  /api/documents/:id       - Update document
DELETE /api/documents/:id       - Delete document
POST   /api/documents/:id/generate - Generate draft
POST   /api/documents/:id/export   - Export to DOCX
```

See full API documentation in `/backend/docs/api.md` (coming soon)

## Testing

### Frontend Tests
```bash
cd frontend
npm test              # Run tests
npm test -- --watch   # Watch mode
npm run test:coverage # Coverage report
```

### Backend Tests
```bash
cd backend
npm test              # Run all tests
npm test:unit         # Unit tests only
npm test:integration  # Integration tests
npm run test:coverage # Coverage report
```

### AI Service Tests
```bash
cd ai-service
source venv/bin/activate
pytest                    # Run all tests
pytest -v                 # Verbose output
pytest --cov=src          # Coverage report
```

### E2E Tests
```bash
cd frontend
npm run test:e2e          # Playwright tests
```

## Deployment

### Staging
```bash
# Build frontend
cd frontend
npm run build

# Deploy backend
cd backend
npm run deploy:staging

# Deploy AI Lambda
cd ai-service
./deploy.sh staging
```

### Production
```bash
# Deploy all services
./deploy.sh production
```

See deployment guide in `/docs/deployment.md` (coming soon)

## Milestones

- [x] **Phase 0**: Foundation & Memory Bank
- [ ] **Milestone 1**: Infrastructure & Storage (~2 weeks)
- [ ] **Milestone 2**: PDF Intake Layer (~1.5 weeks)
- [ ] **Milestone 3**: Template System (~2 weeks)
- [ ] **Milestone 4**: AI Draft Generation (~2.5 weeks)
- [ ] **Milestone 5**: Collaborative Editing (~3 weeks)
- [ ] **Milestone 6**: Export to DOCX (~1.5 weeks)

**Total Estimated Time**: ~12.5 weeks

See detailed progress in `/memory-bank/progress.md`

## Key Features

### ✨ Completed
- Project structure and documentation
- Memory Bank established

### 🚧 In Progress
- Initial codebase scaffolding

### 📋 Upcoming
- PDF upload and text extraction
- AI fact extraction with human review
- Template builder with variables and modules
- Real-time collaborative editing
- DOCX export with letterhead

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/demand_letters
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
S3_BUCKET_NAME=demand-letters-pdfs
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

### AI Service (.env)
```env
ANTHROPIC_API_KEY=your-anthropic-key
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
AWS_REGION=us-east-1
```

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps

# Restart PostgreSQL
docker-compose restart postgres

# Check connection string in .env
echo $DATABASE_URL
```

### Redis Connection Issues
```bash
# Check if Redis is running
docker ps

# Test Redis connection
redis-cli ping
# Should return: PONG

# Restart Redis
docker-compose restart redis
```

### Frontend Won't Start
```bash
# Clear node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Backend Won't Start
```bash
# Check for port conflicts
lsof -i :3000

# Regenerate Prisma client
cd backend
npx prisma generate
```

### AI Service Issues
```bash
# Verify Python version
python --version  # Should be 3.11+

# Reinstall dependencies
cd ai-service
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Test Anthropic API key
python -c "import anthropic; print('API key valid')"
```

## Performance Targets

- **Draft Generation**: < 10 seconds
- **API Response Time**: < 2 seconds (p95)
- **Database Queries**: < 500ms (p95)
- **WebSocket Sync Latency**: < 100ms
- **PDF Upload**: < 2 seconds per file

## Security

- **Encryption at Rest**: S3 SSE-KMS
- **Encryption in Transit**: TLS 1.2+
- **Authentication**: JWT with httpOnly cookies
- **Authorization**: Role-based access control
- **Data Privacy**: No AI training on customer data
- **Audit Logging**: All sensitive actions logged

## Contributing

1. Read `/memory-bank/projectbrief.md` for project context
2. Check `/memory-bank/activeContext.md` for current focus
3. Review `.cursor/rules/base.mdc` for code standards
4. Create feature branch
5. Make changes with tests
6. Submit PR with clear description

## Documentation

- **Memory Bank**: `/memory-bank/` - Complete project documentation
- **API Docs**: `/backend/docs/` - API specifications (coming soon)
- **Architecture**: `/memory-bank/systemPatterns.md`
- **Progress**: `/memory-bank/progress.md`

## Support

For questions or issues:
1. Check troubleshooting section above
2. Review Memory Bank documentation
3. Check `.cursor/rules/base.mdc` for common patterns
4. Contact development team

## License

Proprietary - Steno © 2025

---

**Status**: Phase 0 - Foundation ✅
**Next Milestone**: Milestone 1 - Infrastructure & Storage
**Last Updated**: November 11, 2025

