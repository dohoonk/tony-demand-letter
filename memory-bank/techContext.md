# Technical Context - Demand Letter Generator

## Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite or Create React App
- **UI Library**: Tailwind CSS for styling
- **Editor**: TipTap (ProseMirror-based rich text editor)
- **Collaboration**: Y.js for CRDT-based real-time sync
- **State Management**: React Context or Zustand (lightweight)
- **HTTP Client**: Axios or Fetch API
- **WebSocket**: Native WebSocket API + Y.js WebSocket provider

### Backend
- **Runtime**: Node.js 18+ LTS
- **Framework**: Express.js
- **Language**: TypeScript
- **Authentication**: JWT (jsonwebtoken library)
- **WebSocket**: ws library + Y.js
- **File Upload**: multer or busboy
- **Validation**: zod or joi
- **API Documentation**: OpenAPI/Swagger (optional)

### AI Service
- **Language**: Python 3.11+
- **Deployment**: AWS Lambda
- **AI Provider**: Anthropic API (Claude 3.5 Sonnet)
- **PDF Processing**: PyPDF2, pdfplumber, or pypdf
- **HTTP Framework**: AWS Lambda handler or FastAPI (if self-hosted)
- **Environment**: Python virtual environment (venv)

### Database
- **Primary**: PostgreSQL 15+
- **ORM**: Prisma (Node.js) or TypeORM
- **Migrations**: Prisma Migrate or Knex.js
- **Connection Pooling**: pg-pool or Prisma connection pooling

### Storage
- **Object Storage**: AWS S3
- **Encryption**: Server-side encryption (SSE-KMS)
- **SDK**: AWS SDK for JavaScript v3

### Cache & Real-Time
- **Cache**: Redis 7+
- **Use Cases**: 
  - WebSocket pub/sub for collaboration
  - Session storage
  - Template caching
- **Client**: ioredis (Node.js)

### Export Service
- **Library**: docxtemplater or officegen (Node.js)
- **Templating**: Handlebars or docxtemplater syntax
- **Alternative**: Python python-docx (if separate service)

## Development Setup

### Prerequisites
```bash
# Required installations
- Node.js 18+ (nvm recommended)
- Python 3.11+ (pyenv recommended)
- PostgreSQL 15+
- Redis 7+
- AWS CLI (for S3 operations)
- Docker (optional, for containerized services)
```

### Environment Variables
```bash
# .env file structure

# Backend
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/demand_letters
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=demand-letters-pdfs
S3_BUCKET_REGION=us-east-1

# Anthropic API
ANTHROPIC_API_KEY=your-anthropic-key
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Python Lambda (if self-hosted)
AI_SERVICE_URL=http://localhost:8000

# Frontend
REACT_APP_API_URL=http://localhost:3000
REACT_APP_WS_URL=ws://localhost:3000
```

### Local Development Setup

#### 1. Clone and Install
```bash
# Project structure
demand-letter/
├── frontend/          # React application
├── backend/           # Node.js API
├── ai-service/        # Python Lambda
├── shared/            # Shared types (TypeScript)
└── docker-compose.yml # Local services (Postgres, Redis)
```

#### 2. Database Setup
```bash
# Start PostgreSQL (Docker)
docker run -d \
  --name postgres-demand \
  -e POSTGRES_DB=demand_letters \
  -e POSTGRES_USER=dev \
  -e POSTGRES_PASSWORD=devpass \
  -p 5432:5432 \
  postgres:15

# Run migrations
cd backend
npm run migrate
```

#### 3. Redis Setup
```bash
# Start Redis (Docker)
docker run -d \
  --name redis-demand \
  -p 6379:6379 \
  redis:7
```

#### 4. Backend Setup
```bash
cd backend
npm install
npm run dev  # Starts Express server with hot reload
```

#### 5. Frontend Setup
```bash
cd frontend
npm install
npm run dev  # Starts Vite dev server
```

#### 6. AI Service Setup
```bash
cd ai-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python lambda_handler.py  # Local development server
```

## Database Schema

### Core Tables

#### `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'attorney', -- attorney, paralegal, viewer
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `documents`
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  created_by UUID REFERENCES users(id),
  template_id UUID REFERENCES templates(id),
  status VARCHAR(50) DEFAULT 'draft', -- draft, in_review, finalized
  content JSONB, -- Y.js document state or rich text
  metadata JSONB, -- Case details, variables
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_documents_created_by ON documents(created_by);
CREATE INDEX idx_documents_status ON documents(status);
```

#### `pdfs`
```sql
CREATE TABLE pdfs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  filename VARCHAR(500) NOT NULL,
  s3_key VARCHAR(1000) NOT NULL,
  file_size_bytes BIGINT,
  mime_type VARCHAR(100),
  extracted_text TEXT,
  page_count INT,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pdfs_document_id ON pdfs(document_id);
```

#### `facts`
```sql
CREATE TABLE facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  pdf_id UUID REFERENCES pdfs(id),
  fact_text TEXT NOT NULL,
  citation VARCHAR(500), -- "police_report.pdf, page 3"
  page_number INT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, edited
  original_text TEXT, -- If edited, store original
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_facts_document_id ON facts(document_id);
CREATE INDEX idx_facts_status ON facts(status);
```

#### `templates`
```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- e.g., "Personal Injury", "Contract Dispute"
  structure JSONB NOT NULL, -- Template structure with placeholders
  variables JSONB, -- [{name: "client_name", type: "text", required: true}]
  created_by UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `paragraph_modules`
```sql
CREATE TABLE paragraph_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES templates(id),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[], -- For filtering/search
  position_hint VARCHAR(50), -- early, middle, late
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_paragraph_modules_template ON paragraph_modules(template_id);
```

#### `document_versions`
```sql
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  content JSONB NOT NULL, -- Full document snapshot
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_versions_document ON document_versions(document_id, version_number DESC);
```

#### `audit_logs`
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  document_id UUID REFERENCES documents(id),
  action VARCHAR(100) NOT NULL, -- uploaded_pdf, approved_fact, generated_draft, exported
  metadata JSONB, -- Additional context
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_document ON audit_logs(document_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
```

## API Endpoints

### Authentication
```
POST   /api/auth/register    - Register new user
POST   /api/auth/login       - Login and receive JWT
POST   /api/auth/refresh     - Refresh access token
POST   /api/auth/logout      - Logout (invalidate token)
GET    /api/auth/me          - Get current user
```

### Documents
```
GET    /api/documents              - List all documents
POST   /api/documents              - Create new document
GET    /api/documents/:id          - Get document details
PATCH  /api/documents/:id          - Update document
DELETE /api/documents/:id          - Delete document
POST   /api/documents/:id/generate - Generate draft
POST   /api/documents/:id/export   - Export to DOCX
```

### PDFs
```
POST   /api/documents/:id/pdfs     - Upload PDFs
GET    /api/documents/:id/pdfs     - List PDFs for document
DELETE /api/pdfs/:id                - Delete PDF
GET    /api/pdfs/:id/download      - Download original PDF
```

### Facts
```
GET    /api/documents/:id/facts         - Get all facts
PATCH  /api/facts/:id                   - Update fact (approve/edit/reject)
POST   /api/documents/:id/facts/extract - Trigger fact extraction
```

### Templates
```
GET    /api/templates           - List all templates
POST   /api/templates           - Create template
GET    /api/templates/:id       - Get template details
PATCH  /api/templates/:id       - Update template
DELETE /api/templates/:id       - Delete template
```

### Paragraph Modules
```
GET    /api/templates/:id/paragraphs    - List paragraphs for template
POST   /api/templates/:id/paragraphs    - Create paragraph module
PATCH  /api/paragraphs/:id              - Update paragraph
DELETE /api/paragraphs/:id              - Delete paragraph
```

### Versions
```
GET    /api/documents/:id/versions      - List all versions
POST   /api/documents/:id/versions      - Create version snapshot
POST   /api/documents/:id/versions/:vid/restore - Restore version
```

### WebSocket
```
WS     /api/collaborate/:documentId     - Real-time collaboration
```

## Technical Constraints

### Performance Requirements
- **API Response Time**: < 2 seconds (p95)
- **Database Query Time**: < 500ms (p95)
- **Draft Generation**: < 10 seconds
- **PDF Upload**: Support up to 50MB per file
- **Concurrent Users**: 50+ simultaneous users
- **Collaborative Editing**: < 100ms sync latency

### Security Requirements
- **Encryption at Rest**: S3 SSE-KMS for PDFs
- **Encryption in Transit**: TLS 1.2+ for all connections
- **Authentication**: JWT with short expiration (15 min)
- **Authorization**: Role-based access control
- **Data Privacy**: No training on customer data
- **Audit Trail**: All sensitive actions logged

### Scalability Targets
- **Documents**: Support 10,000+ documents per firm
- **PDFs**: 50 PDFs per document, 50MB each
- **Concurrent Editors**: 2-6 typical, up to 15 supported
- **Storage**: Design for multi-TB PDF storage
- **Database**: Optimize for 100K+ facts, 1M+ audit logs

## Dependencies

### Frontend Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "@tiptap/react": "^2.1.0",
    "@tiptap/starter-kit": "^2.1.0",
    "y-prosemirror": "^1.2.0",
    "y-websocket": "^1.5.0",
    "yjs": "^13.6.0",
    "axios": "^1.6.0",
    "tailwindcss": "^3.4.0",
    "zustand": "^4.4.0"
  }
}
```

### Backend Dependencies
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "typescript": "^5.0.0",
    "@prisma/client": "^5.7.0",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "multer": "^1.4.5-lts.1",
    "ws": "^8.14.0",
    "ioredis": "^5.3.0",
    "yjs": "^13.6.0",
    "y-redis": "^1.0.0",
    "@aws-sdk/client-s3": "^3.470.0",
    "zod": "^3.22.0",
    "dotenv": "^16.3.0"
  }
}
```

### Python AI Service Dependencies
```txt
anthropic>=0.8.0
pypdf>=3.17.0
pdfplumber>=0.10.0
pydantic>=2.5.0
boto3>=1.34.0  # For S3 access
```

## Testing Strategy

### Frontend Testing
- **Unit Tests**: Jest + React Testing Library
- **Component Tests**: Storybook
- **E2E Tests**: Playwright or Cypress

### Backend Testing
- **Unit Tests**: Jest
- **Integration Tests**: Supertest
- **Database Tests**: Test database with migrations

### AI Service Testing
- **Unit Tests**: pytest
- **Prompt Tests**: Golden dataset of sample inputs/outputs
- **Integration Tests**: Mock Anthropic API responses

## Deployment

### Development
- Local Docker Compose for Postgres + Redis
- Frontend: Vite dev server
- Backend: ts-node-dev with hot reload
- AI Service: Local Python server

### Staging
- AWS ECS or Elastic Beanstalk
- RDS PostgreSQL
- ElastiCache Redis
- S3 with versioning enabled
- Lambda for AI service

### Production
- Multi-AZ deployment for high availability
- CloudFront CDN for static assets
- Application Load Balancer for backend
- Auto-scaling for Lambda
- Database backups (point-in-time recovery)
- CloudWatch for monitoring and alerts

