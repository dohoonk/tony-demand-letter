# System Patterns - Demand Letter Generator

## Architecture Overview

### Microservices Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     React Frontend                      │
│  (Document Editor, Fact Review UI, Template Builder)   │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ REST API + WebSocket
                   │
┌──────────────────▼──────────────────────────────────────┐
│               Node.js Backend (Express)                 │
│  • Authentication & Authorization                       │
│  • Document management API                              │
│  • Template CRUD operations                             │
│  • WebSocket server (Y.js sync)                         │
└──┬──────────┬──────────┬──────────────┬────────────┬───┘
   │          │          │              │            │
   │          │          │              │            │
   ▼          ▼          ▼              ▼            ▼
┌─────┐  ┌──────┐  ┌─────────┐  ┌──────────┐  ┌────────┐
│ S3  │  │Redis │  │Postgres │  │Python AI │  │ DOCX   │
│ PDFs│  │Pub/  │  │Database │  │ Lambda   │  │Export  │
│     │  │Sub   │  │         │  │(Anthropic│  │Service │
└─────┘  └──────┘  └─────────┘  └──────────┘  └────────┘
```

### Service Responsibilities

#### **Frontend (React + TypeScript)**
- Document editor interface (TipTap)
- Fact review and approval UI
- Template builder and management
- Drag-and-drop paragraph library
- Real-time collaboration UI (presence indicators)
- DOCX export trigger

#### **Backend API (Node.js + Express)**
- RESTful API for CRUD operations
- Authentication (JWT-based)
- File upload handling (multipart/form-data)
- WebSocket server for Y.js collaboration
- Business logic orchestration
- Audit log recording

#### **AI Service (Python Lambda)**
- PDF text extraction (PyPDF2 / pdfplumber)
- Structured fact extraction (Anthropic API)
- Draft generation pipeline (multi-stage prompts)
- Tone adjustment operations
- Invoked via AWS Lambda or direct HTTP endpoint

#### **DOCX Export Service (Node.js)**
- Template-based document generation
- Firm letterhead application
- Formatting preservation
- Could be integrated into main backend or separate microservice

#### **Storage Layer**
- **S3**: Raw PDF files, generated DOCX files
- **PostgreSQL**: Users, documents, templates, facts, versions, audit logs
- **Redis**: Real-time collaboration pub/sub, session management

## Key Technical Decisions

### 1. Real-Time Collaboration Stack
**Decision**: TipTap + Y.js + WebSockets + Redis

**Rationale**:
- **TipTap**: Modern, extensible editor built on ProseMirror
- **Y.js**: CRDT (Conflict-free Replicated Data Type) for conflict resolution
- **WebSockets**: Low-latency bidirectional communication
- **Redis Pub/Sub**: Scales WebSocket connections across multiple backend instances

**How it works**:
```
User A types → Y.js encodes change → WebSocket → Redis Pub/Sub 
→ All connected WebSockets → Y.js applies change → User B sees update
```

### 2. AI Pipeline Architecture
**Decision**: Multi-stage prompt pipeline (not single-shot generation)

**Stages**:
1. **Extraction**: PDF text → Structured JSON facts
2. **Citation**: Link facts to source documents/pages
3. **Narrative**: Facts → Legal argument outline
4. **Template Merge**: Outline + Template + Paragraphs → Draft structure
5. **Generation**: Structured draft → Natural language
6. **Tone Adjustment**: Apply professional/firm/assertive style

**Rationale**: Better control, easier debugging, higher quality output

### 3. Template System Design
**Decision**: Two-part system (Variables + Paragraph Modules)

**Variables**: Simple string replacement
```json
{
  "client_name": "John Smith",
  "incident_date": "March 15, 2024",
  "defendant_name": "ABC Insurance"
}
```

**Paragraph Modules**: Reusable sections with conditional logic
```json
{
  "id": "liability_clear_fault",
  "title": "Liability - Clear Fault",
  "content": "The defendant's negligence is evident...",
  "tags": ["auto_accident", "rear_end_collision"],
  "position": "early"
}
```

**Rationale**: Flexibility + consistency. Variables for facts, modules for legal arguments.

### 4. Fact Approval Workflow
**Decision**: Human-in-the-loop before generation (not after)

**Flow**:
```
Extract Facts → Review UI (Approve/Edit/Reject) → 
Only Approved Facts → AI Generation
```

**Rationale**: Prevents hallucinations from propagating into final draft. Attorneys trust the output more.

### 5. Version Control Strategy
**Decision**: Snapshot-based versioning (not git-style diffs)

**Implementation**:
- Every save = full document snapshot stored
- Metadata: timestamp, user, version number
- Restore = replace current document with snapshot

**Rationale**: Simple, reliable, no complex merge logic needed. Legal documents need point-in-time recovery.

### 6. Authentication
**Decision**: JWT-based auth with refresh tokens

**Implementation**:
- Short-lived access tokens (15 min)
- Long-lived refresh tokens (7 days)
- Tokens stored in httpOnly cookies
- Single-firm deployment = no complex tenancy

**Rationale**: Secure, scalable, stateless. Easy to add SSO later.

## Design Patterns in Use

### 1. Repository Pattern (Data Access)
```typescript
// Separates data access from business logic
interface DocumentRepository {
  create(data: DocumentData): Promise<Document>
  findById(id: string): Promise<Document | null>
  update(id: string, data: Partial<DocumentData>): Promise<Document>
  delete(id: string): Promise<void>
}
```

### 2. Service Layer Pattern (Business Logic)
```typescript
class DraftGenerationService {
  async generateDraft(documentId: string, templateId: string) {
    // 1. Fetch approved facts
    // 2. Fetch template
    // 3. Call AI service
    // 4. Save draft
    // 5. Create version snapshot
    // 6. Log audit event
  }
}
```

### 3. Command Pattern (Audit Log)
```typescript
interface AuditCommand {
  type: string
  userId: string
  documentId: string
  metadata: Record<string, any>
  timestamp: Date
}

// Every action = audit command stored append-only
```

### 4. Observer Pattern (WebSocket Collaboration)
```typescript
// Y.js observes document changes
yDoc.on('update', (update) => {
  // Broadcast to all connected clients
  broadcastUpdate(update)
})
```

### 5. Strategy Pattern (Tone Adjustment)
```typescript
interface ToneStrategy {
  adjust(draft: string): Promise<string>
}

class ProfessionalTone implements ToneStrategy { ... }
class FirmTone implements ToneStrategy { ... }
class AssertiveTone implements ToneStrategy { ... }
```

## Component Relationships

### Frontend Component Hierarchy
```
<App>
  <AuthProvider>
    <Router>
      <Dashboard>
        <DocumentList />
        <TemplateList />
      </Dashboard>
      
      <DocumentEditor>
        <FactReviewPanel />
        <TemplateSelector />
        <ParagraphLibrary />
        <CollaborativeEditor>
          <TipTapEditor />
          <PresenceIndicators />
        </CollaborativeEditor>
        <SidebarFactsPanel />
        <ExportButton />
      </DocumentEditor>
      
      <TemplateBuilder>
        <VariableEditor />
        <ParagraphModuleEditor />
        <TemplatePreview />
      </TemplateBuilder>
    </Router>
  </AuthProvider>
</App>
```

### Backend Service Dependencies
```
┌───────────────────────────────────────┐
│        Express Application            │
├───────────────────────────────────────┤
│  AuthMiddleware → All Protected Routes│
├───────────────────────────────────────┤
│  DocumentController                   │
│    ↓                                  │
│  DocumentService                      │
│    ↓                                  │
│  DocumentRepository → PostgreSQL      │
├───────────────────────────────────────┤
│  AIService → Python Lambda            │
├───────────────────────────────────────┤
│  WebSocketServer → Y.js → Redis       │
└───────────────────────────────────────┘
```

### Database Schema Relationships
```
users
  ↓ (one-to-many)
documents ← (many-to-one) → templates
  ↓ (one-to-many)          ↓ (one-to-many)
facts                    paragraph_modules
  ↓ (one-to-many)
document_versions

users ← (many-to-one) → audit_logs
```

## Data Flow Examples

### Example 1: Uploading PDFs and Extracting Facts
```
1. User uploads 3 PDFs via <FileUpload /> component
2. Frontend → POST /api/documents with multipart/form-data
3. Backend receives files:
   a. Saves to S3 with encryption
   b. Creates document records in Postgres
   c. Invokes Python Lambda for text extraction
4. Lambda extracts text from each PDF
5. Lambda calls Anthropic API for fact extraction
6. Lambda returns structured facts with citations
7. Backend stores facts (status: "pending_review")
8. Backend returns document ID + facts to frontend
9. Frontend shows <FactReviewPanel /> with facts
10. User approves/edits/rejects each fact
11. Frontend → PATCH /api/documents/:id/facts
12. Backend updates fact statuses to "approved"
```

### Example 2: Collaborative Editing
```
1. User A opens document in editor
2. Frontend establishes WebSocket connection
3. WebSocket server loads Y.js document from Redis/Postgres
4. User A types "The defendant was negligent..."
5. Y.js captures change as CRDT update
6. Update sent via WebSocket to backend
7. Backend broadcasts to Redis pub/sub
8. Redis notifies all WebSocket servers
9. Update sent to User B's WebSocket connection
10. User B's Y.js applies update
11. User B sees text appear in real-time
```

### Example 3: Generating Draft
```
1. User clicks "Generate Draft" button
2. Frontend → POST /api/documents/:id/generate
3. Backend orchestrates generation:
   a. Fetch approved facts from Postgres
   b. Fetch selected template + paragraph modules
   c. Build structured prompt payload
   d. Invoke Python Lambda with payload
4. Lambda executes multi-stage pipeline:
   a. Stage 1: Facts → Narrative outline
   b. Stage 2: Outline + Template → Structure
   c. Stage 3: Structure + Tone → Final draft
5. Lambda returns generated text
6. Backend:
   a. Stores draft in document
   b. Creates version snapshot
   c. Logs audit event
7. Backend returns draft to frontend
8. Frontend loads draft into TipTap editor
9. Y.js initializes collaborative document state
```

## Scaling Considerations

### Horizontal Scaling
- **Backend**: Stateless Node.js instances behind load balancer
- **WebSocket**: Redis pub/sub allows multiple WS servers
- **AI Lambda**: Scales automatically with AWS Lambda

### Performance Optimizations
- **Database**: Indexed queries on user_id, document_id, created_at
- **S3**: CloudFront CDN for PDF downloads
- **Redis**: Cache frequently accessed templates
- **Frontend**: Code splitting, lazy loading, React.memo

### Reliability Patterns
- **Circuit Breaker**: If AI service fails, fall back to manual editing
- **Retry Logic**: Exponential backoff for transient failures
- **Health Checks**: All services expose /health endpoints
- **Graceful Degradation**: If WebSocket fails, fall back to autosave polling

