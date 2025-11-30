# Steno Demand Letter Generator

> **AI-powered demand letter drafting workspace for law firms**  
> Reducing drafting time by 50%+ through intelligent automation

[![Status](https://img.shields.io/badge/status-MVP-success.svg)]()
[![Deployment](https://img.shields.io/badge/deployment-Heroku-purple.svg)]()

---

## 🚀 Quick Start

```bash
# 1. Clone and install dependencies
git clone <repo-url> && cd "Demand Letter"

# 2. Start local services (PostgreSQL + Redis for future use)
docker-compose up -d
# Note: Redis is available but NOT currently used by the app

# 3. Configure environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp ai-service/.env.example ai-service/.env
# Edit .env files with your credentials

# 4. Run all services
# Terminal 1 - Backend
cd backend && npm install && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm install && npm run dev

# Terminal 3 - AI Service
cd ai-service && pip install -r requirements.txt && python lambda_handler.py
```

**Access**: http://localhost:5173

---

## 📋 Table of Contents

- [Problem & Solution](#-problem--solution)
- [Architecture Overview](#-architecture-overview)
- [Why This Architecture?](#-why-this-architecture)
- [Tech Stack](#-tech-stack)
- [Key Features](#-key-features)
- [Development Guide](#-development-guide)
- [Deployment](#-deployment)
- [Production Readiness](#-production-readiness)
- [Documentation](#-documentation)

---

## 🎯 Problem & Solution

### The Problem
Personal injury attorneys spend **2.5-4.5 hours** per demand letter:
- 30-60 min: Manual PDF review
- 20-40 min: Fact organization
- 60-120 min: Drafting
- 30-60 min: Review & revision

**Cost**: $300-600 per letter at $150/hour rates

### The Solution
AI-assisted 3-step workflow reduces time to **17-27 minutes** (85-90% savings):

1. **PDF Upload → AI Extraction** (5 min)
   - Upload case PDFs
   - AI extracts structured facts
   - Human approves/edits facts

2. **Template Selection → AI Generation** (2 min)
   - Choose template
   - AI generates complete draft
   - Firm letterhead auto-applied

3. **Collaborative Editing → Export** (10-20 min)
   - Real-time editing
   - Socket.io collaboration
   - Export to DOCX/PDF

---

## 🏗️ Architecture Overview

### Actual Production Architecture

```
┌──────────────┐
│    Vercel    │  Frontend (React + TypeScript)
│   (Frontend) │  • TipTap rich text editor
└──────┬───────┘  • Socket.io real-time sync
       │ HTTPS/WSS
┌──────▼──────────────────────┐
│   Heroku Backend (Node.js)  │
│   • Express REST API        │
│   • Socket.io WebSocket     │
│   • JWT Authentication      │
│   • DOCX/PDF Export         │◄──── AWS S3
│   • Prisma ORM              │     (PDF Storage)
└──────┬────────┬─────────────┘
       │        │
  ┌────▼────┐  │
  │ Heroku  │  │
  │Postgres │  │
  └─────────┘  │
               │
        ┌──────▼──────────────┐
        │ Heroku AI Service   │
        │ (Python FastAPI)    │
        │ • pypdf extraction  │
        │ • Anthropic API     │
        └─────────────────────┘
```

**Why 3 Services?**
- **Frontend**: User interface (Vercel for fast CDN)
- **Backend**: Business logic + WebSockets (Heroku for simplicity)
- **AI Service**: PDF + AI operations (Python ecosystem)

**NOT Microservices**: Just enough separation to isolate AI workload while keeping everything else together.

---

## 💡 Why This Architecture?

### Why Separate AI Service?

**The Honest Answer**: PDF parsing + Python ecosystem

**Reality Check**:
- We use `pypdf` (basic text extraction, not advanced table parsing)
- Anthropic SDK works in both Node.js AND Python
- Main benefit: Future ML flexibility, not current features

**Could we have used Node.js?** Yes! With `pdf-parse` + `@anthropic-ai/sdk`

**Why we stuck with Python**:
- ✅ Slightly easier PDF parsing
- ✅ Python ML ecosystem available for future
- ❌ But adds complexity (separate codebase, type duplication)

### Why Heroku (Not AWS Lambda)?

**File named `lambda_handler.py` but runs on Heroku!**

**Why**:
- No cold starts (always-on is fine for MVP)
- Simpler deployment (git push vs Lambda packaging)
- Same platform as backend
- Predictable $5/month cost

**Trade-offs**:
- ✅ No cold starts, easier deployment
- ❌ Paying for idle time (could save $$ with Lambda at low volume)

### Why Socket.io (Not Y.js)?

**Simple broadcast model** instead of CRDT conflict resolution

**Why**:
- Y.js adds significant complexity
- Legal document editing is mostly sequential
- Single Heroku instance doesn't need distributed conflict resolution
- "Last write wins" is acceptable for MVP

**Limitations**:
- No offline editing
- No conflict resolution
- Can't scale to multiple backend instances without Redis

### Why No Redis?

**Decision**: Skip for MVP

**Why**:
- Single Heroku dyno = in-memory Socket.io rooms work fine
- No session caching needed (JWT in cookies)

**When to add**:
- Scaling to multiple backend instances
- Need Socket.io pub/sub across servers

---

## 🛠️ Tech Stack

### Frontend (React/TypeScript - Vercel)
| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool (fast HMR) |
| TipTap | Rich text editor |
| Socket.io-client | Real-time collaboration |
| Axios | HTTP client |
| shadcn/ui + TailwindCSS | UI components |

### Backend (Node.js - Heroku)
| Technology | Purpose |
|-----------|---------|
| Express + TypeScript | Web framework |
| Prisma | Type-safe ORM |
| Socket.io | WebSocket server |
| JWT + httpOnly cookies | Authentication |
| docx library | DOCX export |
| html-pdf-node | PDF export |
| AWS SDK | S3 integration |

### AI Service (Python - Heroku)
| Technology | Purpose |
|-----------|---------|
| FastAPI + Uvicorn | Async web framework |
| pypdf | PDF text extraction |
| Anthropic SDK | Claude API |
| Pydantic | Request validation |

### Infrastructure
| Service | Platform | Cost/Month |
|---------|----------|------------|
| Frontend | Vercel Hobby | $0 |
| Backend | Heroku Eco | $5 |
| AI Service | Heroku Eco | $5 |
| Database | Heroku Postgres | $5 |
| Storage | AWS S3 | ~$2 |
| AI API | Anthropic | $10-50 |
| **Total** | | **$27-67/month** |

---

## ✨ Key Features

### 1. PDF Upload & Processing
- Direct upload to S3 (presigned URLs)
- pypdf text extraction
- Stores metadata in PostgreSQL

### 2. AI-Powered Fact Extraction
- Claude Haiku 4.5 for cost efficiency ($0.25/M tokens)
- Structured JSON output (parties, dates, injuries, damages)
- Citations with PDF filename + page reference

### 3. Human-in-the-Loop Validation
- Review UI for fact approval
- Edit fact text inline
- Only approved facts used in generation

### 4. Template System
- Firm-specific templates
- Variable substitution
- Reusable paragraph modules

### 5. AI Draft Generation
- Single-stage prompt with approved facts
- Firm letterhead automatically applied
- HTML output for rich formatting

### 6. Real-Time Collaboration
- Socket.io WebSocket connections
- Live presence indicators
- Broadcast model (last write wins)
- Auto-save every 5 seconds

### 7. Document Export
- **DOCX**: Uses `docx` library, HTML→DOCX conversion
- **PDF**: Uses `html-pdf-node` + Puppeteer
- Firm letterhead included
- Professional formatting (Times New Roman, 1" margins)

### 8. Version History
- Snapshot-based versioning
- Full document snapshots on each save
- Restore to any previous version

---

## 💻 Development Guide

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Docker Desktop (for local services)

### Project Structure
```
demand-letter/
├── frontend/          # React + TypeScript
├── backend/          # Node.js + Express
├── ai-service/       # Python FastAPI
├── docker-compose.yml
└── README.md
```

### Environment Setup

**Backend** (`backend/.env`):
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/demand_letters
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
S3_BUCKET_NAME=your-bucket
AI_SERVICE_URL=http://localhost:8000
CORS_ORIGIN=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```bash
VITE_API_URL=http://localhost:3000
```

**AI Service** (`ai-service/.env`):
```bash
ANTHROPIC_API_KEY=sk-ant-your-key
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
```

### Database Migrations
```bash
cd backend
npx prisma migrate dev      # Run migrations
npx prisma studio           # Open database GUI
npx prisma generate         # Regenerate Prisma client
```

### Development Workflow
```bash
# Backend hot reload (nodemon)
cd backend && npm run dev

# Frontend hot reload (Vite HMR)
cd frontend && npm run dev

# AI service hot reload (uvicorn --reload)
cd ai-service && python lambda_handler.py
```

---

## 🚢 Deployment

### Current Setup: Heroku

**Backend**:
```bash
heroku create steno-backend
heroku addons:create heroku-postgresql:essential-0
heroku config:set JWT_SECRET=... AWS_ACCESS_KEY_ID=...
git subtree push --prefix backend heroku main
```

**AI Service**:
```bash
heroku create steno-ai-service
heroku config:set ANTHROPIC_API_KEY=...
git subtree push --prefix ai-service heroku main
```

**Frontend**: Deploy to Vercel
```bash
cd frontend
vercel --prod
```

See [`HEROKU_DEPLOYMENT.md`](HEROKU_DEPLOYMENT.md) for detailed steps.

---

## 🎯 Production Readiness

This is an **MVP** designed for rapid development. For production, see [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md) for detailed improvements needed:

### Current Limitations
- ❌ Single Heroku instance (no load balancing)
- ❌ No Redis (Socket.io won't scale to multiple instances)
- ❌ Simple broadcast (no conflict resolution)
- ❌ No rate limiting
- ❌ Minimal error handling
- ❌ No automated tests
- ❌ No monitoring/alerting
- ❌ Secrets in .env files

### Production Improvements Needed

**Security** (High Priority):
- Rate limiting (express-rate-limit)
- Input sanitization
- CORS whitelist
- Secrets management (AWS Secrets Manager)
- File upload validation (magic bytes)

**Scalability** (Medium Priority):
- Redis pub/sub for multi-instance Socket.io
- Y.js CRDT for conflict resolution
- Database connection pooling
- Lambda migration for AI service (cost optimization)

**Observability** (High Priority):
- Structured logging (JSON format)
- APM (New Relic, Datadog)
- Error tracking (Sentry)
- Metrics dashboards

**Testing** (High Priority):
- Unit tests (Jest)
- Integration tests (Supertest)
- E2E tests (Playwright)

See [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md) for complete roadmap.

---

## 📚 Documentation

### Project Documentation
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Detailed architecture, data flows, design decisions
- **[PRODUCTION_READINESS.md](PRODUCTION_READINESS.md)** - Production improvement roadmap
- **[INTERVIEW_GUIDE.md](INTERVIEW_GUIDE.md)** - Interview prep, talking points, Q&A
- **[HEROKU_DEPLOYMENT.md](HEROKU_DEPLOYMENT.md)** - Deployment guide
- **[memory-bank/](memory-bank/)** - Project context and progress

### Code Documentation
**Comprehensive JSDoc comments added to key services** (760+ lines):
- **`backend/src/services/ExportService.ts`** - DOCX/PDF export with HTML conversion, production TODOs
- **`backend/src/services/FactService.ts`** - Fact extraction, approval workflow, draft generation orchestration  
- **`frontend/src/utils/textConverter.ts`** - HTML/text format conversion utilities
- **`backend/src/controllers/exportController.ts`** - Export endpoint handlers

All methods include: purpose, parameters, return types, flow explanations, and production considerations.

---

## 🎤 Interview Talking Points

### Architecture Decision
**Q: Why separate the AI service?**

**A**: "Pragmatic separation for language specialization. Python has a better PDF parsing ecosystem with pypdf, and it keeps the door open for future ML enhancements. That said, it could have been all Node.js - the Anthropic SDK works in both languages. The main trade-off is maintaining two codebases vs. the flexibility Python provides."

### Technology Choices
**Q: Why Python for AI if Anthropic works in Node.js?**

**A**: "Honest answer: It's primarily for PDF parsing. pypdf is simpler than Node.js alternatives for basic text extraction. We're not using advanced features like pdfplumber's table extraction - just plain text. The real benefit is potential future flexibility for ML libraries, not current capabilities. It adds complexity (separate codebase, type duplication) but keeps options open."

### Scalability
**Q: What would you change for production?**

**A**: "Three main areas:
1. **Observability**: Add structured logging, APM, and error tracking - currently minimal
2. **Scalability**: Add Redis pub/sub to scale Socket.io across multiple instances
3. **Security**: Rate limiting, input validation, and proper secrets management

The architecture is intentionally simple for MVP. It's not Netflix-scale microservices (overkill) but also not a monolith (AI separation makes sense). It's right-sized for 2-6 concurrent users per document."

---

## 📝 License

Proprietary - Steno © 2025

---

## 🤝 Contributing

1. Read project context in [`memory-bank/projectbrief.md`](memory-bank/projectbrief.md)
2. Check [`memory-bank/activeContext.md`](memory-bank/activeContext.md) for current focus
3. Review code standards in [`ARCHITECTURE.md`](ARCHITECTURE.md)
4. Create feature branch: `git checkout -b feature/your-feature`
5. Run linters before committing

---

**Project Status**: MVP Complete, Interview Prep  
**Last Updated**: January 2025

---

## Quick Architecture Tour (For Interviews)

### 1. Request Flow: PDF Upload → Draft Generation
```
User → Frontend → Backend → S3 (PDF)
                ↓
         AI Service ← S3 (download)
                ↓ (pypdf extraction)
         Anthropic API
                ↓ (facts JSON)
         Backend → Database
                ↓ (user approves)
         AI Service ← Anthropic
                ↓ (HTML draft)
         Backend → Database
                ↓
         Frontend (TipTap editor)
```

### 2. Key Files to Know
- **Backend API**: `backend/src/index.ts` - Express app setup
- **Document Service**: `backend/src/services/DocumentService.ts` - CRUD + S3
- **Fact Extraction**: `backend/src/services/FactService.ts` - AI orchestration
- **Export**: `backend/src/services/ExportService.ts` - DOCX/PDF generation
- **WebSocket**: `backend/src/services/SocketService.ts` - Socket.io rooms
- **AI Entry**: `ai-service/lambda_handler.py` - FastAPI app
- **PDF Parsing**: `ai-service/src/services/pdf_extractor.py` - pypdf
- **AI Calls**: `ai-service/src/services/anthropic_service.py` - Claude API

### 3. Database Schema (Simplified)
```
users → documents → pdfs → facts
              ↓
        collaborators
              ↓
        versions
```

### 4. Authentication Flow
```
Login → bcrypt verify → JWT (15min) + Refresh (7d)
                    ↓
            httpOnly cookies
                    ↓
      Middleware verifies on each request
```

This architecture demonstrates **pragmatic engineering**: Right-sized for the problem, simple where possible, complex only where necessary.

