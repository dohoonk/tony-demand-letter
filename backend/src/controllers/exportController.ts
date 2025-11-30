import { Request, Response } from 'express'
import ExportService from '../services/ExportService'
import prisma from '../config/database'

class ExportController {
  async exportDocx(req: Request, res: Response) {
    try {
      const { documentId } = req.params

      // Get document
      const document = await prisma.document.findUnique({
        where: { id: documentId },
      })

      if (!document) {
        return res.status(404).json({
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: 'Document not found',
          },
        })
      }

      // Generate DOCX
      const buffer = await ExportService.exportToDocx(documentId)

      // Log audit event
      await prisma.auditLog.create({
        data: {
          userId: req.user!.userId,
          documentId,
          action: 'exported',
          metadata: {
            format: 'docx',
          },
        },
      })

      // Send file
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      res.setHeader('Content-Disposition', `attachment; filename="${document.title.replace(/[^a-z0-9]/gi, '_')}.docx"`)
      res.send(buffer)
    } catch (error: any) {
      console.error('Export error:', error)
      res.status(500).json({
        error: {
          code: 'EXPORT_ERROR',
          message: error.message || 'Error exporting document',
        },
      })
    }
  }

  async exportPdf(req: Request, res: Response) {
    try {
      const { documentId } = req.params

      // Get document
      const document = await prisma.document.findUnique({
        where: { id: documentId },
      })

      if (!document) {
        return res.status(404).json({
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: 'Document not found',
          },
        })
      }

      // Generate PDF
      const buffer = await ExportService.exportToPdf(documentId)

      // Log audit event
      await prisma.auditLog.create({
        data: {
          userId: req.user!.userId,
          documentId,
          action: 'exported',
          metadata: {
            format: 'pdf',
          },
        },
      })

      // Send file
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="${document.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`)
      res.send(buffer)
    } catch (error: any) {
      console.error('Export PDF error:', error)
      res.status(500).json({
        error: {
          code: 'EXPORT_ERROR',
          message: error.message || 'Error exporting document to PDF',
        },
      })
    }
  }
}

export default new ExportController()

