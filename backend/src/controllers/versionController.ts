import { Request, Response } from 'express'
import { z } from 'zod'
import VersionService from '../services/VersionService'

const createVersionSchema = z.object({
  content: z.any(),
  note: z.string().optional(),
})

class VersionController {
  async createVersion(req: Request, res: Response) {
    try {
      const { documentId } = req.params
      const validated = createVersionSchema.parse(req.body)

      const version = await VersionService.createVersion(
        documentId,
        validated.content,
        req.user!.userId,
        validated.note
      )

      res.status(201).json({
        data: version,
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

      console.error('Create version error:', error)
      res.status(500).json({
        error: {
          code: 'CREATE_VERSION_ERROR',
          message: error.message || 'Error creating version',
        },
      })
    }
  }

  async listVersions(req: Request, res: Response) {
    try {
      const { documentId } = req.params

      const versions = await VersionService.listVersions(documentId)

      res.json({
        data: versions,
      })
    } catch (error) {
      console.error('List versions error:', error)
      res.status(500).json({
        error: {
          code: 'LIST_VERSIONS_ERROR',
          message: 'Error fetching versions',
        },
      })
    }
  }

  async getVersion(req: Request, res: Response) {
    try {
      const { versionId } = req.params

      const version = await VersionService.getVersion(versionId)

      res.json({
        data: version,
      })
    } catch (error: any) {
      if (error.message === 'Version not found') {
        return res.status(404).json({
          error: {
            code: 'VERSION_NOT_FOUND',
            message: error.message,
          },
        })
      }

      console.error('Get version error:', error)
      res.status(500).json({
        error: {
          code: 'GET_VERSION_ERROR',
          message: 'Error fetching version',
        },
      })
    }
  }

  async restoreVersion(req: Request, res: Response) {
    try {
      const { documentId, versionId } = req.params

      const document = await VersionService.restoreVersion(
        documentId,
        versionId,
        req.user!.userId
      )

      res.json({
        data: document,
      })
    } catch (error: any) {
      if (error.message === 'Version not found') {
        return res.status(404).json({
          error: {
            code: 'VERSION_NOT_FOUND',
            message: error.message,
          },
        })
      }

      console.error('Restore version error:', error)
      res.status(500).json({
        error: {
          code: 'RESTORE_VERSION_ERROR',
          message: error.message || 'Error restoring version',
        },
      })
    }
  }

  async deleteVersion(req: Request, res: Response) {
    try {
      const { documentId, versionId } = req.params

      await VersionService.deleteVersion(versionId, documentId)

      res.json({
        data: {
          message: 'Version deleted successfully',
        },
      })
    } catch (error: any) {
      if (error.message === 'Cannot delete the only version') {
        return res.status(400).json({
          error: {
            code: 'CANNOT_DELETE_ONLY_VERSION',
            message: error.message,
          },
        })
      }

      console.error('Delete version error:', error)
      res.status(500).json({
        error: {
          code: 'DELETE_VERSION_ERROR',
          message: 'Error deleting version',
        },
      })
    }
  }
}

export default new VersionController()

