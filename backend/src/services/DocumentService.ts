import prisma from '../config/database'
import { uploadToS3, generateS3Key } from '../config/s3'

export interface CreateDocumentInput {
  title: string
  userId: string
}

export interface UploadPdfInput {
  documentId: string
  file: Express.Multer.File
  userId: string
}

class DocumentService {
  async createDocument(input: CreateDocumentInput) {
    const document = await prisma.document.create({
      data: {
        title: input.title,
        createdById: input.userId,
        status: 'draft',
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    })

    return document
  }

  async getDocument(id: string, userId: string) {
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        pdfs: {
          select: {
            id: true,
            filename: true,
            fileSizeBytes: true,
            pageCount: true,
            createdAt: true,
          },
        },
        template: true,
      },
    })

    if (!document) {
      throw new Error('Document not found')
    }

    // Convert BigInt to Number for JSON serialization
    return {
      ...document,
      pdfs: document.pdfs.map(pdf => ({
        ...pdf,
        fileSizeBytes: Number(pdf.fileSizeBytes),
      })),
    }
  }

  async listDocuments(userId: string) {
    const documents = await prisma.document.findMany({
      where: {
        OR: [
          { createdById: userId },
          // In future: add shared documents logic
        ],
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            pdfs: true,
            facts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return documents
  }

  async updateDocument(id: string, userId: string, data: any) {
    const document = await prisma.document.findUnique({
      where: { id },
    })

    if (!document) {
      throw new Error('Document not found')
    }

    const updated = await prisma.document.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    })

    return updated
  }

  async deleteDocument(id: string, userId: string) {
    const document = await prisma.document.findUnique({
      where: { id },
    })

    if (!document) {
      throw new Error('Document not found')
    }

    // Delete document (cascade will delete related PDFs, facts, etc.)
    await prisma.document.delete({
      where: { id },
    })

    // TODO: Delete files from S3
  }

  async uploadPdf(input: UploadPdfInput) {
    // Generate S3 key
    const s3Key = generateS3Key(input.documentId, input.file.originalname)

    // Upload to S3
    await uploadToS3({
      key: s3Key,
      body: input.file.buffer,
      contentType: input.file.mimetype,
    })

    // Create PDF record in database
    const pdf = await prisma.pdf.create({
      data: {
        documentId: input.documentId,
        filename: input.file.originalname,
        s3Key,
        fileSizeBytes: BigInt(input.file.size),
        mimeType: input.file.mimetype,
        uploadedById: input.userId,
      },
    })

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        documentId: input.documentId,
        action: 'uploaded_pdf',
        metadata: {
          filename: input.file.originalname,
          size: input.file.size,
        },
      },
    })

    // Convert BigInt to Number for JSON serialization
    return {
      ...pdf,
      fileSizeBytes: Number(pdf.fileSizeBytes),
    }
  }

  async listPdfs(documentId: string) {
    const pdfs = await prisma.pdf.findMany({
      where: { documentId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Convert BigInt to Number for JSON serialization
    return pdfs.map(pdf => ({
      ...pdf,
      fileSizeBytes: Number(pdf.fileSizeBytes),
    }))
  }

  async deletePdf(id: string, userId: string) {
    const pdf = await prisma.pdf.findUnique({
      where: { id },
    })

    if (!pdf) {
      throw new Error('PDF not found')
    }

    // Delete from database
    await prisma.pdf.delete({
      where: { id },
    })

    // TODO: Delete from S3

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId,
        documentId: pdf.documentId,
        action: 'deleted_pdf',
        metadata: {
          filename: pdf.filename,
        },
      },
    })
  }
}

export default new DocumentService()

