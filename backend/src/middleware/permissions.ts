import { Request, Response, NextFunction } from 'express'
import { CollaboratorService } from '../services/CollaboratorService'

/**
 * Middleware to check if user has access to a document
 * Usage: checkDocumentAccess('editor') - requires editor or owner permission
 *        checkDocumentAccess() - requires any access (viewer, editor, or owner)
 */
export function checkDocumentAccess(requiredPermission?: 'owner' | 'editor' | 'viewer') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId
      const documentId = req.params.documentId || req.params.id

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { message: 'Unauthorized' }
        })
      }

      if (!documentId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Document ID is required' }
        })
      }

      // Check if user has access
      await CollaboratorService.checkAccess(documentId, userId, requiredPermission)

      // Attach permission level to request for later use
      const permission = await CollaboratorService.getUserPermission(documentId, userId)
      req.userPermission = permission

      next()
    } catch (error: any) {
      console.error('Permission check failed:', error)
      res.status(403).json({
        success: false,
        error: { message: error.message || 'Access denied' }
      })
    }
  }
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userPermission?: string | null
    }
  }
}

