# Product Context - Demand Letter Generator

## Why This Product Exists

### The Problem in Detail
Demand letters are a critical step in litigation—they formally notify opposing parties of claims and demands before potential legal action. Creating these letters requires:

1. **Document Review**: Reading through police reports, medical records, correspondence, insurance documents, witness statements
2. **Fact Extraction**: Identifying key details (dates, parties, injuries, damages, liability)
3. **Narrative Construction**: Building a persuasive legal argument with proper structure
4. **Professional Tone**: Maintaining firm voice and meeting legal writing standards
5. **Template Adherence**: Following firm-specific formats and required sections

This process currently takes **hours per letter** and varies widely based on attorney writing skill.

### Current Workflow Pain Points
- **Manual extraction**: Attorneys must read every page and take notes
- **Repetitive structure**: Most demand letters follow similar patterns but are written from scratch
- **Inconsistent output**: Different attorneys produce different quality/tone
- **No collaboration**: Word doc emailed back and forth, version confusion
- **Legacy tools**: Existing legal drafting software is clunky and outdated

## User Journey

### Primary Flow: Attorney Creates Demand Letter

```
1. Matter Setup
   - Attorney opens "New Demand Letter"
   - Uploads case PDFs (police report, medical records, correspondence)
   - System extracts text from all documents

2. Fact Review (Critical Quality Gate)
   - AI proposes structured facts with PDF citations
   - Attorney reviews each fact:
     * Approve (checkmark)
     * Edit (inline correction)
     * Reject (remove)
   - Example: "Plaintiff suffered neck injury [police_report.pdf, p.3]"

3. Template Selection
   - Choose firm template (e.g., "Personal Injury Demand - Auto Accident")
   - Fill in variables: {{client_name}}, {{incident_date}}, {{defendant_name}}
   - Select paragraph modules: 
     * Liability argument
     * Medical damages section
     * Lost wages calculation
     * Pain and suffering

4. AI Generation
   - System combines: Approved Facts + Template + Selected Paragraphs
   - Generates complete draft in ~5-10 seconds
   - User sees full demand letter in editor

5. Collaborative Refinement
   - Attorney invites paralegal to review
   - Both edit simultaneously (Google Docs style)
   - Presence indicators show who's active
   - Auto-save + version history

6. Export
   - Attorney clicks "Export to Word"
   - System applies firm letterhead template
   - Downloads professional DOCX ready to send
```

### Secondary Flow: Paralegal Supports Drafting

```
1. Paralegal uploads case documents
2. Reviews and approves extracted facts
3. Applies initial template
4. Generates first draft
5. Attorney reviews and refines
6. Paralegal makes final edits
7. Attorney exports and sends
```

## User Experience Goals

### Design Philosophy
**"Document is the hero"** - The writing surface is central, controls are secondary.

### UX Principles
1. **Calm, not cluttered**: Minimal UI chrome, contextual controls
2. **Typography-led**: Professional serif for document, clean sans for UI
3. **Focus Mode**: One-click distraction-free environment
4. **Intentional whitespace**: Visual clarity = confidence
5. **Subtle collaboration**: Presence indicators don't distract

### Aesthetic Inspiration
- **Linear**: Precision and calm
- **Notion**: Clean document-first layout
- **Craft Docs**: Premium polish and emotional clarity

### Key UI Features

#### 1. Fact Approval Panel
```
┌─────────────────────────────────────────┐
│ Extracted Facts (8 pending review)     │
├─────────────────────────────────────────┤
│ ✓ Incident occurred on March 15, 2024  │
│   [police_report.pdf, page 1]          │
│                                         │
│ ? Plaintiff suffered neck injury       │
│   [medical_records.pdf, page 3]        │
│   [Edit] [Approve] [Reject]            │
└─────────────────────────────────────────┘
```

#### 2. Paragraph Library (Drag & Drop)
```
┌─────────────────────────────────────────┐
│ Reusable Sections                       │
├─────────────────────────────────────────┤
│ 📄 Liability - Clear Fault              │
│ 📄 Medical Damages - Standard           │
│ 📄 Lost Wages - Employment Impact       │
│ 📄 Pain & Suffering - Severe            │
└─────────────────────────────────────────┘
```

#### 3. Collaborative Editor
```
┌──────────────────────────────────────────┐
│ [Attorney] [Paralegal]  Focus Mode  ⬇️   │
├──────────────────────────────────────────┤
│                                          │
│  Re: Demand for Settlement               │
│                                          │
│  Dear Ms. Johnson,                       │
│                                          │
│  This letter serves as formal demand... │
│                                          │
└──────────────────────────────────────────┘
```

#### 4. Sidebar Facts Reference
```
Always visible during editing:
┌─────────────────────────┐
│ Case Facts              │
├─────────────────────────┤
│ • Client: John Smith    │
│ • Date: March 15, 2024  │
│ • Location: I-95 Exit 7 │
│ • Injury: Neck, Back    │
│ • Damages: $47,500      │
└─────────────────────────┘
```

## Problems This Solves

### For Attorneys
- ✅ Saves hours per demand letter
- ✅ Maintains consistent professional tone
- ✅ Reduces risk of missing key facts
- ✅ Provides starting point for customization

### For Paralegals
- ✅ Clear task list (upload, review facts, apply template)
- ✅ Real-time collaboration with attorneys
- ✅ Reduces back-and-forth email exchanges

### For Law Firms
- ✅ Standardized output across all attorneys
- ✅ Faster case turnaround
- ✅ Improved client satisfaction
- ✅ Junior attorney productivity boost

## How It Should Work

### Quality Principles
1. **Accuracy over speed**: Fact approval gate ensures correctness
2. **Transparency**: Always show source citations for extracted facts
3. **Flexibility**: AI draft is starting point, not final output
4. **Consistency**: Templates ensure firm standards are met
5. **Collaboration**: Multiple users can work together seamlessly

### Performance Expectations
- PDF upload: < 2 seconds per file
- Text extraction: < 3 seconds per 100-page PDF
- Fact extraction: < 5 seconds for typical case
- Draft generation: < 10 seconds
- Collaborative sync: < 100ms latency
- Export to DOCX: < 3 seconds

### Error Handling Philosophy
- **Graceful degradation**: If AI fails, show error and allow manual drafting
- **No data loss**: Autosave + version history prevents lost work
- **Clear feedback**: User always knows what's happening (loading states, error messages)
- **Retry logic**: Transient failures automatically retry

## Non-Goals (Deliberately Excluded)

### V1 Exclusions
- ❌ Autonomous legal reasoning (AI is drafting assistant, not lawyer)
- ❌ Case strategy recommendations
- ❌ Document precedent search
- ❌ Integration with case management systems
- ❌ Mobile app (desktop-first for professional work)
- ❌ Multi-language support (English only initially)
- ❌ OCR for scanned documents (text-based PDFs only)

### Future Considerations (Post-V1)
- P1: Track changes/redline mode
- P1: Tone adjustment slider (Professional → Assertive)
- P2: Suggested clauses based on case patterns
- P2: DMS integrations (NetDocs, iManage)
- P2: Advanced analytics (draft quality metrics)

