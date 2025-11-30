import prisma from '../config/database'
import axios from 'axios'

/**
 * FactService
 * 
 * Manages fact extraction, approval workflow, and draft generation.
 * This is the core orchestration service that coordinates between:
 * - Backend database (Prisma)
 * - AI Service (Python FastAPI on Heroku - NOT Lambda despite the name)
 * - Anthropic API (via AI Service)
 * 
 * Key Workflows:
 * 1. Extract facts from PDFs using AI
 * 2. Human-in-the-loop approval (attorneys review each fact)
 * 3. Generate draft using approved facts
 */
class FactService {
  /**
   * Extract structured facts from all PDFs in a document
   * 
   * Flow:
   * 1. Fetch all PDFs with extracted text from database
   * 2. For each PDF, call AI service via HTTP POST to /invoke
   * 3. AI service calls Claude API to extract structured facts
   * 4. Parse returned JSON and save facts to database with status='pending'
   * 5. Log audit event for compliance
   * 
   * Why HTTP to AI service instead of Lambda?
   * - AI service is deployed to Heroku as FastAPI web server (not Lambda)
   * - File is named lambda_handler.py but runs as always-on web server
   * - Chose Heroku for MVP simplicity: no cold starts, easier deployment
   * 
   * TODO [PRODUCTION]:
   * - Add retry logic with exponential backoff for AI service failures
   * - Implement parallel processing instead of sequential (Promise.all)
   * - Add progress tracking for documents with many PDFs (WebSocket updates)
   * - Implement circuit breaker pattern if AI service is down
   * - Add timeout handling (currently waits indefinitely)
   * 
   * @param documentId - UUID of the document to extract facts from
   * @param userId - User making the request (for audit logging)
   * @returns Array of extracted facts with status='pending'
   * @throws Error if no PDFs found for document
   */
  async extractFactsFromDocument(documentId: string, userId: string) {
    // Fetch all PDFs that have been uploaded and have extracted text
    // Note: extractedText is populated by separate PDF text extraction step
    const pdfs = await prisma.pdf.findMany({
      where: { documentId },
      select: {
        id: true,
        filename: true,
        extractedText: true, // Populated by pypdf in AI service
      },
    })

    if (pdfs.length === 0) {
      throw new Error('No PDFs found for this document')
    }

    // AI Service runs on Heroku (not Lambda), accessible via HTTP
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000'
    const allFacts = []

    // Process each PDF sequentially
    // TODO [PRODUCTION]: Use Promise.all() for parallel processing
    for (const pdf of pdfs) {
      if (!pdf.extractedText) {
        // TODO [PRODUCTION]: Use structured logger instead of console.log
        console.log(`Skipping ${pdf.filename} - no extracted text`)
        continue
      }

      try {
        // Call AI service /invoke endpoint with operation='extract_facts'
        // AI service will call Anthropic Claude API to extract structured facts
        // Expects JSON response: { facts: [{ fact_text, category, page_reference }] }
        const response = await axios.post(`${aiServiceUrl}/invoke`, {
          operation: 'extract_facts',
          payload: {
            documentId,
            pdfText: pdf.extractedText,
            pdfFilename: pdf.filename,
          },
        })

        // Parse response - AI service returns Lambda-style response format
        // response.data.body contains JSON string with facts array
        const facts = response.data.body ? JSON.parse(response.data.body).facts : []

        // Save each fact to database with status='pending'
        // Attorney will review and approve/edit/reject each fact before draft generation
        for (const fact of facts) {
          const created = await prisma.fact.create({
            data: {
              documentId,
              pdfId: pdf.id,
              // Handle different field naming from AI service (snake_case vs camelCase)
              factText: fact.fact_text || fact.factText || 'Unknown fact',
              // Citation includes PDF filename and page reference for attorney verification
              citation: `${pdf.filename}, ${fact.page_reference || 'page unknown'}`,
              status: 'pending', // Requires human approval before use in draft
            },
          })
          allFacts.push(created)
        }
      } catch (error: any) {
        // TODO [PRODUCTION]: Use Sentry for error tracking instead of console.error
        // TODO [PRODUCTION]: Don't silently continue - notify user of failures
        console.error(`Error extracting facts from ${pdf.filename}:`, error.message)
        // Currently continues to next PDF if one fails
        // Consider: Should we fail fast or continue processing?
      }
    }

    // Create audit log for compliance tracking
    // All fact extractions are logged with metadata
    await prisma.auditLog.create({
      data: {
        userId,
        documentId,
        action: 'extracted_facts',
        metadata: {
          factsExtracted: allFacts.length,
        },
      },
    })

    return allFacts
  }

  /**
   * List all facts for a document
   * 
   * Returns facts ordered by creation time (chronological order they were extracted)
   * Includes PDF metadata for citation display
   * 
   * TODO [PRODUCTION]:
   * - Add pagination (currently returns all facts)
   * - Add filtering by status (pending, approved, rejected, edited)
   * - Add caching if facts list is accessed frequently
   * 
   * @param documentId - UUID of the document
   * @returns Array of facts with PDF filename included
   */
  /**
   * Lists all facts for a document with PDF source info
   * 
   * Production TODO:
   * - Add filtering by status
   * - Add pagination for documents with 100+ facts
   * - Include confidence scores
   * - Group by category
   * 
   * @param documentId - Document UUID
   * @returns Array of facts with PDF source info
   */
  async listFacts(documentId: string) {
    const facts = await prisma.fact.findMany({
      where: { documentId },
      include: {
        pdf: {
          select: {
            id: true,
            filename: true, // Needed for citation display
          },
        },
      },
      orderBy: {
        createdAt: 'asc', // Chronological order
      },
    })

    return facts
  }

  /**
   * Update a fact with review metadata
   * 
   * Internal method used by approve/reject/edit operations.
   * Automatically records who reviewed and when.
   * 
   * @param id - Fact ID
   * @param data - Fields to update
   * @param userId - User making the change
   * @returns Updated fact
   */
  /**
   * Updates a fact's status or text
   * 
   * Production TODO:
   * - Validate status transitions (pending→approved, not approved→pending)
   * - Add version history for fact edits
   * - Require permission check
   * 
   * @param id - Fact UUID
   * @param data - Fields to update
   * @param userId - User making update
   * @returns Updated fact
   */
  async updateFact(id: string, data: any, userId: string) {
    const fact = await prisma.fact.update({
      where: { id },
      data: {
        ...data,
        reviewedById: userId, // Track who reviewed
        reviewedAt: new Date(), // Track when reviewed
      },
    })

    return fact
  }

  /**
   * Approve a fact for use in draft generation
   * 
   * Part of human-in-the-loop validation workflow.
   * Only facts with status 'approved' or 'edited' are used in draft generation.
   * This prevents AI hallucinations from propagating into final draft.
   * 
   * @param id - Fact ID
   * @param userId - Approving user
   * @returns Updated fact with status='approved'
   */
  async approveFact(id: string, userId: string) {
    return this.updateFact(id, { status: 'approved' }, userId)
  }

  /**
   * Reject a fact (won't be used in draft generation)
   * 
   * @param id - Fact ID
   * @param userId - Rejecting user
   * @returns Updated fact with status='rejected'
   */
  async rejectFact(id: string, userId: string) {
    return this.updateFact(id, { status: 'rejected' }, userId)
  }

  /**
   * Edit a fact's text while preserving the original
   * 
   * Stores original text before editing so attorney can see what AI extracted.
   * Updated fact gets status='edited' and is included in draft generation.
   * 
   * @param id - Fact ID
   * @param newText - Corrected fact text
   * @param userId - Editing user
   * @returns Updated fact with status='edited' and originalText preserved
   */
  async editFact(id: string, newText: string, userId: string) {
    const fact = await prisma.fact.findUnique({
      where: { id },
    })

    if (!fact) {
      throw new Error('Fact not found')
    }

    // Preserve original AI-extracted text for audit trail
    return this.updateFact(
      id,
      {
        factText: newText,
        originalText: fact.factText, // Store original for comparison
        status: 'edited', // Indicates human modification
      },
      userId
    )
  }

  /**
   * Delete a fact
   * 
   * TODO [PRODUCTION]:
   * - Add soft delete instead of hard delete
   * - Require permission check (only owner/editor can delete)
   * - Log deletion in audit log
   * 
   * @param id - Fact ID
   */
  async deleteFact(id: string) {
    await prisma.fact.delete({
      where: { id },
    })
  }

  /**
   * Generate demand letter draft using approved facts and AI
   * 
   * This is the core value proposition: transform approved facts into professional demand letter.
   * 
   * Flow:
   * 1. Fetch approved/edited facts from database
   * 2. Fetch template configuration (if any)
   * 3. Fetch firm settings for letterhead
   * 4. Call AI service with facts + template + firm info
   * 5. AI service calls Claude API with structured prompt
   * 6. Parse HTML response and clean markdown code fences
   * 7. Save draft to document.content
   * 8. Create version snapshot
   * 9. Log audit event
   * 
   * Why single-stage prompt instead of multi-stage?
   * - Simpler implementation (MVP priority)
   * - Faster generation (one API call vs multiple)
   * - Claude Haiku is good enough for single-stage
   * - Can add multi-stage later if quality issues arise
   * 
   * Why Claude Haiku instead of Sonnet?
   * - Cost optimization: $0.25/M input vs $3/M (12x cheaper)
   * - Fast enough for MVP (<5 seconds typical)
   * - Quality sufficient for draft generation
   * - Can upgrade to Sonnet if attorneys request better quality
   * 
   * TODO [PRODUCTION]:
   * - Add retry logic with exponential backoff
   * - Implement timeout handling (currently waits indefinitely)
   * - Add progress updates via WebSocket for long generations
   * - Track AI API costs per document (store token counts)
   * - Implement prompt caching (Anthropic feature) for 90% cost savings
   * - Add A/B testing framework for prompt improvements
   * - Validate HTML structure before saving (prevent malformed content)
   * 
   * @param documentId - UUID of the document
   * @param userId - User requesting generation (for audit log)
   * @returns Generated draft as HTML string
   * @throws Error if no approved facts found
   */
  async generateDraft(documentId: string, userId: string) {
    // Fetch only approved or edited facts
    // Rejected and pending facts are excluded (human validation gate)
    const facts = await prisma.fact.findMany({
      where: {
        documentId,
        status: { in: ['approved', 'edited'] }, // Only human-validated facts
      },
    })

    // Require at least one approved fact to proceed
    // This is the "human-in-the-loop" quality gate
    if (facts.length === 0) {
      throw new Error('No approved facts found. Please review and approve facts first.')
    }

    // Fetch document and associated template (optional)
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        template: true, // Template provides structure and variables
      },
    })

    // Fetch firm settings for letterhead
    // Firm settings include name, address, phone, email for professional letterhead
    const firmSettings = await prisma.firmSettings.findUnique({
      where: { id: 1 }, // Single-firm deployment: always ID=1
    })

    // Call AI service (Python FastAPI on Heroku)
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000'
    
    // Send facts, template, and firm info to AI service
    // AI service will build prompt and call Claude API
    const response = await axios.post(`${aiServiceUrl}/invoke`, {
      operation: 'generate_draft',
      payload: {
        // Send only text and citation (not internal IDs)
        facts: facts.map(f => ({
          factText: f.factText,
          citation: f.citation, // e.g., "accident_report.pdf, page 3"
        })),
        templateStructure: document?.template?.structure || {},
        templateContent: document?.template?.name || '',
        // Firm info is used to build letterhead in draft
        firmInfo: firmSettings ? {
          firmName: firmSettings.firmName,
          address: firmSettings.address,
          city: firmSettings.city,
          state: firmSettings.state,
          zipCode: firmSettings.zipCode,
          phone: firmSettings.phone,
          email: firmSettings.email,
        } : null,
      },
    })

    // Parse response from AI service (Lambda-style response format)
    let draft = response.data.body ? JSON.parse(response.data.body).draft : 'Error generating draft'
    
    // Claude sometimes wraps HTML in markdown code fences (```html ... ```)
    // This regex removes them if present
    // Example: "```html\n<div>...</div>\n```" → "<div>...</div>"
    draft = draft.replace(/^```\w*\n?/m, '').replace(/\n?```\s*$/m, '').trim()

    // Save generated draft to document
    // Content is stored as ProseMirror JSON (TipTap's document format)
    // TODO [PRODUCTION]: Validate HTML structure before saving
    await prisma.document.update({
      where: { id: documentId },
      data: {
        content: {
          type: 'doc', // ProseMirror document root
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: draft }],
            },
          ],
        },
      },
    })

    // Create version snapshot for history/rollback
    // TODO [PRODUCTION]: Increment version number properly (currently hardcoded to 1)
    await prisma.documentVersion.create({
      data: {
        documentId,
        versionNumber: 1, // TODO: Calculate actual version number
        content: { draft },
        createdById: userId,
      },
    })

    // Log audit event for compliance tracking
    await prisma.auditLog.create({
      data: {
        userId,
        documentId,
        action: 'generated_draft',
        metadata: {
          factsUsed: facts.length,
          // TODO [PRODUCTION]: Add token counts and cost here
        },
      },
    })

    return draft
  }
}

export default new FactService()

