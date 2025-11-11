# Project Brief - Steno Demand Letter Generator

## Project Identity
- **Organization:** Steno
- **Project Name:** Demand Letter Generator
- **Project ID:** 8mKWMdtQ1jdYzU0cVQPV_1762206474285
- **Deployment Model:** Single-firm deployment

## Core Mission
Build an AI-powered drafting workspace that reduces attorney and paralegal time spent preparing demand letters by at least 50%, while maintaining professional consistency and enabling real-time collaboration.

## Problem We're Solving
Attorneys spend excessive time manually reviewing case documents and crafting demand letters. Current tools are:
- Slow and repetitive
- Visually outdated
- Lacking collaborative features
- Dependent on individual writing ability

## Solution Approach
An intelligent drafting system that:
1. **Extracts** facts from multiple PDF case documents
2. **Validates** facts through human review (critical quality gate)
3. **Generates** structured drafts using AI + firm templates
4. **Enables** real-time collaborative editing
5. **Exports** professional DOCX with firm letterhead

## Key Differentiators
- **Fact Approval Workflow**: Human verification before generation (quality control)
- **Document-First UI**: Clean, typography-led interface (vs legacy legal tools)
- **Template + Paragraph System**: Reusable sections + variables for consistency
- **Real-time Collaboration**: Multiple users editing simultaneously
- **Citation-Backed Facts**: Extracted facts reference source PDFs

## Success Metrics
| Metric | Target |
|--------|--------|
| Time reduction | ≥ 50% |
| Draft quality | ≥ 90% require only light edits |
| Firm adoption | ≥ 80% weekly usage |
| Turnaround speed | Faster demand delivery |

## Target Users
- **Attorneys**: Create, edit, approve, finalize, and export letters
- **Paralegals**: Support drafting workflow, collaborative editing
- **Viewers**: Read-only access (optional)

**Shared workspace**: All firm users see shared documents and templates

## Core Workflows
```
Upload PDFs → Extract Facts → Review/Approve Facts → 
Apply Template → AI Generation → Collaborative Edit → Export DOCX
```

## Technical Constraints
- **Performance**: Draft generation < 10 seconds
- **Scale**: Support 2-6 concurrent editors per document (up to 15)
- **Limits**: 50 PDFs max, 50MB each, ~50k char drafts
- **Security**: S3+KMS encryption, TLS 1.2+, no model training on data
- **Compliance**: Audit logs for all critical actions

## Out of Scope (V1)
- Multi-tenancy (single firm only)
- Per-document access control
- OCR for scanned PDFs
- Mobile app
- DMS integrations (NetDocs, iManage)
- Advanced AI beyond draft generation

## Development Milestones
1. **Infrastructure & Storage** - Database, S3, auth
2. **PDF Intake Layer** - Upload, extract, store
3. **Template System** - Variables + paragraph library
4. **AI Draft Generation** - Fact extraction, approval, generation
5. **Collaborative Editing** - TipTap + Y.js + WebSockets
6. **Export** - DOCX rendering with letterhead

## Tech Stack
- **Frontend**: React + TypeScript
- **Backend**: Node.js (Express)
- **AI Service**: Python (AWS Lambda) + Anthropic API
- **Database**: PostgreSQL
- **Storage**: AWS S3
- **Real-time**: TipTap + Y.js + WebSockets + Redis
- **Architecture**: Microservices

