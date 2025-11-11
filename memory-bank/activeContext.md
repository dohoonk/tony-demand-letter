# Active Context - Demand Letter Generator

## Current Focus
🚀 **Project Initialization Complete! Ready for Milestone 1**

We have successfully established the foundation for the Demand Letter Generator:
1. ✅ Memory Bank established (all core documents)
2. ✅ Project structure created (frontend, backend, ai-service)
3. ✅ Initial codebase scaffolding complete
4. ✅ Configuration files set up (Docker, TypeScript, Prisma)
5. ✅ Git repository initialized

**Next**: Begin Milestone 1 - Infrastructure & Storage implementation

## Recent Decisions

### Tech Stack Confirmed (Nov 11, 2025)
- **Frontend**: React + TypeScript (not Next.js)
- **Backend**: Node.js with Express
- **AI Service**: Python (AWS Lambda) + Anthropic API
- **Database**: PostgreSQL
- **Real-time**: TipTap + Y.js + WebSockets + Redis
- **Storage**: AWS S3
- **Architecture**: Microservices

### PRD Evolution
- Started with initial PRD (basic requirements)
- Updated to PRD v2 with critical additions:
  - Fact approval workflow (human-in-the-loop quality gate)
  - Multi-document handling (up to 50 PDFs)
  - Single-firm deployment model (no multi-tenancy)
  - Detailed versioning and audit trail
  - Clear performance limits

### Permission Model
- **Decision**: All users can create/edit firm templates
- **Rationale**: No admin role complexity in V1, trust-based single-firm model

## Next Steps

### Immediate (Now)
1. ✅ Memory Bank files created
2. ✅ Create project directory structure
3. ✅ Initialize Git repository
4. ✅ Set up frontend (React + TypeScript + Vite)
5. ✅ Set up backend (Node.js + Express + TypeScript)
6. ✅ Set up AI service (Python + Lambda structure)
7. ✅ Create shared types directory
8. ✅ Docker Compose for local Postgres + Redis
9. ✅ Initial README with setup instructions
10. ✅ Prisma schema defined
11. ✅ Basic Express server with health check
12. ✅ React app with routing structure

### Milestone 1: Infrastructure & Storage
**Goal**: Database, S3, authentication foundation

**Tasks**:
- [ ] Database schema implementation (Prisma or TypeORM)
- [ ] Run initial migrations (users, documents, templates tables)
- [ ] S3 bucket setup with encryption
- [ ] JWT authentication implementation
  - Register endpoint
  - Login endpoint
  - Refresh token mechanism
  - Auth middleware
- [ ] Basic health check endpoints
- [ ] Error handling middleware
- [ ] Request logging

**Acceptance Criteria**:
- User can register and login
- JWT tokens are issued and validated
- Database tables created and accessible
- S3 bucket ready for file uploads
- Health check returns 200 OK

### Milestone 2: PDF Intake Layer
**Goal**: Upload PDFs, extract text, store metadata

**Tasks**:
- [ ] PDF upload endpoint (multipart/form-data)
- [ ] S3 upload integration with encryption
- [ ] Python service: text extraction from PDFs
- [ ] Store extracted text in database
- [ ] Frontend: PDF upload UI component
- [ ] Frontend: Document list view
- [ ] Error handling for invalid/corrupted PDFs

**Acceptance Criteria**:
- User can upload multiple PDFs (up to 50)
- Files stored in S3 with proper naming
- Text extracted and stored in `pdfs` table
- UI shows upload progress and success
- Invalid files rejected with clear error messages

### Milestone 3: Template System
**Goal**: Create templates with variables and paragraph modules

**Tasks**:
- [ ] Template CRUD API endpoints
- [ ] Paragraph module CRUD API endpoints
- [ ] Template builder UI (variable editor)
- [ ] Paragraph library UI (create, tag, search)
- [ ] Drag-and-drop paragraph insertion
- [ ] Template preview with sample data
- [ ] Template validation (required fields, structure)

**Acceptance Criteria**:
- User can create template with variables
- User can create paragraph modules with tags
- User can preview template with sample data
- Templates saved and retrievable
- Paragraph modules associated with templates

### Milestone 4: AI Draft Generation Pipeline
**Goal**: Extract facts, approve, generate draft

**Tasks**:
- [ ] Python Lambda: fact extraction from PDF text
- [ ] Anthropic API integration (Claude 3.5 Sonnet)
- [ ] Fact extraction prompt engineering
- [ ] Fact approval UI (approve/edit/reject)
- [ ] Multi-stage draft generation pipeline
  - Facts → Narrative
  - Narrative + Template → Structure
  - Structure + Tone → Draft
- [ ] Draft generation API endpoint
- [ ] Display generated draft in editor
- [ ] Error handling for AI failures

**Acceptance Criteria**:
- Facts extracted with PDF citations
- User can approve/edit/reject each fact
- Only approved facts used in generation
- Draft generated in < 10 seconds
- Draft displayed in TipTap editor
- Graceful degradation if AI fails

### Milestone 5: Collaborative Editing
**Goal**: Real-time multi-user editing

**Tasks**:
- [ ] TipTap editor integration
- [ ] Y.js CRDT setup
- [ ] WebSocket server implementation
- [ ] Redis pub/sub for multi-instance scaling
- [ ] Presence indicators (active users)
- [ ] Autosave (every 30 seconds)
- [ ] Version history (snapshot on save)
- [ ] Restore previous version functionality
- [ ] Conflict-free editing (Y.js handles this)

**Acceptance Criteria**:
- 2+ users can edit simultaneously
- Changes sync in real-time (< 100ms latency)
- Presence indicators show active users
- Document autosaves without user action
- User can view and restore previous versions
- No data loss during network interruption

### Milestone 6: Export
**Goal**: Export to DOCX with firm letterhead

**Tasks**:
- [ ] DOCX generation library setup (docxtemplater or python-docx)
- [ ] Firm letterhead template system
- [ ] Export API endpoint
- [ ] Convert TipTap JSON to DOCX format
- [ ] Preserve formatting (bold, italic, lists, etc.)
- [ ] Download endpoint for generated DOCX
- [ ] Frontend: Export button + download handling
- [ ] Audit log: record export events

**Acceptance Criteria**:
- User clicks "Export" and receives DOCX file
- File opens correctly in Microsoft Word
- Formatting preserved (fonts, styles, spacing)
- Firm letterhead applied
- Export logged in audit trail

## Active Questions & Considerations

### Open Questions
1. **Firm Letterhead**: Should letterhead be:
   - Uploaded as DOCX template file?
   - Configured via UI (logo + header/footer text)?
   - Hardcoded initially with config file?

2. **Session Management**: How long should user sessions last?
   - Current plan: 15-min access token, 7-day refresh token
   - Should we have "remember me" option?

3. **PDF Preview**: Should we render PDF thumbnails in UI?
   - Requires additional processing
   - Nice UX but not critical for V1

4. **Fact Extraction Quality**: What's acceptable accuracy?
   - Need golden dataset for testing
   - May require prompt iteration

5. **Cost Monitoring**: Should we track AI API costs per document?
   - Useful for analytics but adds complexity
   - Could add in post-V1

### Technical Risks
- **Y.js Complexity**: Real-time collaboration is technically challenging
  - Mitigation: Start with basic TipTap, add Y.js incrementally
- **AI Hallucinations**: Facts may be inaccurate
  - Mitigation: Human approval workflow (already designed)
- **PDF Parsing**: Not all PDFs extract cleanly
  - Mitigation: Clear error messages, manual text input fallback
- **WebSocket Scaling**: Redis pub/sub required for multi-instance
  - Mitigation: Start with single instance, add Redis when needed

### Design Decisions Needed
1. **Tone Slider (P1 Feature)**:
   - When user adjusts tone, regenerate entire draft or inline edits?
   - Decision: Defer to post-V1, focus on single tone generation first

2. **Track Changes (P1 Feature)**:
   - Redline mode like Word's track changes
   - Decision: Defer to post-V1, version history covers basic need

3. **OCR (P1 Feature)**:
   - AWS Textract for scanned PDFs
   - Decision: Defer to post-V1, focus on text-based PDFs

## Current Blockers
None - ready to proceed with implementation.

## Recent Changes
- Memory Bank structure created
- Project scope clarified through PRD updates
- Tech stack confirmed with user

## Collaboration Notes
- **Working with**: User (Dohoon Kim)
- **Communication style**: Direct, focused on essentials
- **Decision speed**: Fast - user prefers action over extensive planning
- **Preferred approach**: Build incrementally, iterate based on working software

## Environment Notes
- **Workspace**: `/Users/dohoonkim/GauntletAI/Demand Letter/`
- **Date**: November 11, 2025
- **OS**: macOS (darwin 24.6.0)
- **Shell**: zsh

