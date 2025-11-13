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

/**
 * Middleware to check if user has access to a fact's parent document
 * Looks up the fact first to get the document ID, then checks access
 */
export function checkFactAccess(requiredPermission?: 'owner' | 'editor' | 'viewer') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId
      const factId = req.params.id

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { message: 'Unauthorized' }
        })
      }

      if (!factId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Fact ID is required' }
        })
      }

      // Import prisma to look up the fact
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()

      // Look up the fact to get its document ID
      const fact = await prisma.fact.findUnique({
        where: { id: factId },
        select: { documentId: true }
      })

      if (!fact) {
        return res.status(404).json({
          success: false,
          error: { message: 'Fact not found' }
        })
      }

      // Check if user has access to the document
      await CollaboratorService.checkAccess(fact.documentId, userId, requiredPermission)

      // Attach permission level to request for later use
      const permission = await CollaboratorService.getUserPermission(fact.documentId, userId)
      req.userPermission = permission

      next()
    } catch (error: any) {
      console.error('Fact permission check failed:', error)
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

