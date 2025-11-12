import prisma from '../config/database'
import axios from 'axios'

class FactService {
  async extractFactsFromDocument(documentId: string, userId: string) {
    // Get all PDFs for the document
    const pdfs = await prisma.pdf.findMany({
      where: { documentId },
      select: {
        id: true,
        filename: true,
        extractedText: true,
      },
    })

    if (pdfs.length === 0) {
      throw new Error('No PDFs found for this document')
    }

    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000'
    const allFacts = []

    // Extract facts from each PDF
    for (const pdf of pdfs) {
      if (!pdf.extractedText) {
        console.log(`Skipping ${pdf.filename} - no extracted text`)
        continue
      }

      try {
        const response = await axios.post(`${aiServiceUrl}/invoke`, {
          operation: 'extract_facts',
          payload: {
            documentId,
            pdfText: pdf.extractedText,
            pdfFilename: pdf.filename,
          },
        })

        const facts = response.data.body ? JSON.parse(response.data.body).facts : []

        // Save facts to database
        for (const fact of facts) {
          const created = await prisma.fact.create({
            data: {
              documentId,
              pdfId: pdf.id,
              factText: fact.fact_text || fact.factText || 'Unknown fact',
              citation: `${pdf.filename}, ${fact.page_reference || 'page unknown'}`,
              status: 'pending',
            },
          })
          allFacts.push(created)
        }
      } catch (error: any) {
        console.error(`Error extracting facts from ${pdf.filename}:`, error.message)
      }
    }

    // Log audit event
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

  async listFacts(documentId: string) {
    const facts = await prisma.fact.findMany({
      where: { documentId },
      include: {
        pdf: {
          select: {
            id: true,
            filename: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return facts
  }

  async updateFact(id: string, data: any, userId: string) {
    const fact = await prisma.fact.update({
      where: { id },
      data: {
        ...data,
        reviewedById: userId,
        reviewedAt: new Date(),
      },
    })

    return fact
  }

  async approveFact(id: string, userId: string) {
    return this.updateFact(id, { status: 'approved' }, userId)
  }

  async rejectFact(id: string, userId: string) {
    return this.updateFact(id, { status: 'rejected' }, userId)
  }

  async editFact(id: string, newText: string, userId: string) {
    const fact = await prisma.fact.findUnique({
      where: { id },
    })

    if (!fact) {
      throw new Error('Fact not found')
    }

    return this.updateFact(
      id,
      {
        factText: newText,
        originalText: fact.factText,
        status: 'edited',
      },
      userId
    )
  }

  async deleteFact(id: string) {
    await prisma.fact.delete({
      where: { id },
    })
  }

  async generateDraft(documentId: string, userId: string) {
    // Get approved facts
    const facts = await prisma.fact.findMany({
      where: {
        documentId,
        status: { in: ['approved', 'edited'] },
      },
    })

    if (facts.length === 0) {
      throw new Error('No approved facts found. Please review and approve facts first.')
    }

    // Get document with template
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        template: true,
      },
    })

    // Get firm settings for letterhead
    const firmSettings = await prisma.firmSettings.findUnique({
      where: { id: 1 },
    })

    // Call AI service to generate draft
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000'
    
    const response = await axios.post(`${aiServiceUrl}/invoke`, {
      operation: 'generate_draft',
      payload: {
        facts: facts.map(f => ({
          factText: f.factText,
          citation: f.citation,
        })),
        templateStructure: document?.template?.structure || {},
        templateContent: document?.template?.name || '',
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

    const draft = response.data.body ? JSON.parse(response.data.body).draft : 'Error generating draft'

    // Update document with generated draft
    await prisma.document.update({
      where: { id: documentId },
      data: {
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: draft }],
            },
          ],
        },
      },
    })

    // Create version snapshot
    await prisma.documentVersion.create({
      data: {
        documentId,
        versionNumber: 1,
        content: { draft },
        createdById: userId,
      },
    })

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId,
        documentId,
        action: 'generated_draft',
        metadata: {
          factsUsed: facts.length,
        },
      },
    })

    return draft
  }
}

export default new FactService()

