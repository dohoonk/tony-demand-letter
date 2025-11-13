import { Request, Response } from 'express'
import { z } from 'zod'
import DocumentService from '../services/DocumentService'
import axios from 'axios'

const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
})

const updateDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  status: z.enum(['draft', 'in_review', 'finalized']).optional(),
  templateId: z.string().uuid().optional(),
  content: z.any().optional(),
  metadata: z.any().optional(),
})

class DocumentController {
  async create(req: Request, res: Response) {
    try {
      const validated = createDocumentSchema.parse(req.body)

      const document = await DocumentService.createDocument({
        title: validated.title,
        userId: req.user!.userId,
      })

      res.status(201).json({
        data: document,
      })
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: error.errors,
          },
        })
      }

      console.error('Create document error:', error)
      res.status(500).json({
        error: {
          code: 'CREATE_DOCUMENT_ERROR',
          message: 'Error creating document',
        },
      })
    }
  }

  async list(req: Request, res: Response) {
    try {
      const documents = await DocumentService.listDocuments(req.user!.userId)

      res.json({
        data: documents,
      })
    } catch (error) {
      console.error('List documents error:', error)
      res.status(500).json({
        error: {
          code: 'LIST_DOCUMENTS_ERROR',
          message: 'Error fetching documents',
        },
      })
    }
  }

  async getOne(req: Request, res: Response) {
    try {
      const { id } = req.params

      const document = await DocumentService.getDocument(id, req.user!.userId)

      res.json({
        data: document,
      })
    } catch (error: any) {
      if (error.message === 'Document not found') {
        return res.status(404).json({
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: error.message,
          },
        })
      }

      console.error('Get document error:', error)
      res.status(500).json({
        error: {
          code: 'GET_DOCUMENT_ERROR',
          message: 'Error fetching document',
        },
      })
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params
      const validated = updateDocumentSchema.parse(req.body)

      const document = await DocumentService.updateDocument(
        id,
        req.user!.userId,
        validated
      )

      res.json({
        data: document,
      })
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: error.errors,
          },
        })
      }

      if (error.message === 'Document not found') {
        return res.status(404).json({
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: error.message,
          },
        })
      }

      console.error('Update document error:', error)
      res.status(500).json({
        error: {
          code: 'UPDATE_DOCUMENT_ERROR',
          message: 'Error updating document',
        },
      })
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params

      await DocumentService.deleteDocument(id, req.user!.userId)

      res.json({
        data: {
          message: 'Document deleted successfully',
        },
      })
    } catch (error: any) {
      if (error.message === 'Document not found') {
        return res.status(404).json({
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: error.message,
          },
        })
      }

      console.error('Delete document error:', error)
      res.status(500).json({
        error: {
          code: 'DELETE_DOCUMENT_ERROR',
          message: 'Error deleting document',
        },
      })
    }
  }

  async uploadPdf(req: Request, res: Response) {
    try {
      const { id } = req.params
      const file = req.file

      if (!file) {
        return res.status(400).json({
          error: {
            code: 'NO_FILE',
            message: 'No file uploaded',
          },
        })
      }

      const pdf = await DocumentService.uploadPdf({
        documentId: id,
        file,
        userId: req.user!.userId,
      })

      // Trigger text extraction in background
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000'
      
      console.log(`[uploadPdf] Triggering text extraction for PDF ${pdf.id} at ${aiServiceUrl}/invoke`)
      
      // Don't await - fire and forget
      axios.post(`${aiServiceUrl}/invoke`, {
        operation: 'extract_text',
        payload: {
          pdfId: pdf.id,
          s3Key: pdf.s3Key,
        },
      }).then(() => {
        console.log(`[uploadPdf] Text extraction triggered successfully for PDF ${pdf.id}`)
      }).catch((error) => {
        console.error(`[uploadPdf] Error triggering text extraction for PDF ${pdf.id}:`, error.message)
        if (error.response) {
          console.error(`[uploadPdf] Response status: ${error.response.status}`)
          console.error(`[uploadPdf] Response data:`, error.response.data)
        }
      })

      res.status(201).json({
        data: pdf,
      })
    } catch (error) {
      console.error('Upload PDF error:', error)
      res.status(500).json({
        error: {
          code: 'UPLOAD_PDF_ERROR',
          message: 'Error uploading PDF',
        },
      })
    }
  }

  async listPdfs(req: Request, res: Response) {
    try {
      const { id } = req.params

      const pdfs = await DocumentService.listPdfs(id)

      res.json({
        data: pdfs,
      })
    } catch (error) {
      console.error('List PDFs error:', error)
      res.status(500).json({
        error: {
          code: 'LIST_PDFS_ERROR',
          message: 'Error fetching PDFs',
        },
      })
    }
  }

  async deletePdf(req: Request, res: Response) {
    try {
      const { id } = req.params

      await DocumentService.deletePdf(id, req.user!.userId)

      res.json({
        data: {
          message: 'PDF deleted successfully',
        },
      })
    } catch (error: any) {
      if (error.message === 'PDF not found') {
        return res.status(404).json({
          error: {
            code: 'PDF_NOT_FOUND',
            message: error.message,
          },
        })
      }

      console.error('Delete PDF error:', error)
      res.status(500).json({
        error: {
          code: 'DELETE_PDF_ERROR',
          message: 'Error deleting PDF',
        },
      })
    }
  }
}

export default new DocumentController()

