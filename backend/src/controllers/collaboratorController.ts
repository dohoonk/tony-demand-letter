import { Request, Response } from 'express'
import { CollaboratorService } from '../services/CollaboratorService'
import { z } from 'zod'

// Validation schemas
const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  permission: z.enum(['owner', 'editor', 'viewer'], {
    errorMap: () => ({ message: 'Permission must be owner, editor, or viewer' })
  })
})

const updatePermissionSchema = z.object({
  permission: z.enum(['owner', 'editor', 'viewer'])
})

/**
 * Invite a collaborator to a document
 */
export async function inviteCollaborator(req: Request, res: Response) {
  try {
    const { documentId } = req.params
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      })
    }

    // Validate input
    const validation = inviteSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation error',
          details: validation.error.errors
        }
      })
    }

    const { email, permission } = validation.data

    const collaboration = await CollaboratorService.inviteCollaborator({
      documentId,
      email,
      permission,
      invitedBy: userId
    })

    res.status(201).json({
      success: true,
      data: collaboration
    })
  } catch (error: any) {
    console.error('Error inviting collaborator:', error)
    res.status(400).json({
      success: false,
      error: { message: error.message || 'Failed to invite collaborator' }
    })
  }
}

/**
 * List all collaborators for a document
 */
export async function listCollaborators(req: Request, res: Response) {
  try {
    const { documentId } = req.params
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      })
    }

    const result = await CollaboratorService.listCollaborators(documentId, userId)

    res.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    console.error('Error listing collaborators:', error)
    res.status(400).json({
      success: false,
      error: { message: error.message || 'Failed to list collaborators' }
    })
  }
}

/**
 * Get pending invitations for current user
 */
export async function getPendingInvitations(req: Request, res: Response) {
  try {
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      })
    }

    const invitations = await CollaboratorService.getPendingInvitations(userId)

    res.json({
      success: true,
      data: invitations
    })
  } catch (error: any) {
    console.error('Error getting pending invitations:', error)
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get pending invitations' }
    })
  }
}

/**
 * Accept an invitation
 */
export async function acceptInvitation(req: Request, res: Response) {
  try {
    const { collaboratorId } = req.params
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      })
    }

    const collaboration = await CollaboratorService.acceptInvitation(collaboratorId, userId)

    res.json({
      success: true,
      data: collaboration
    })
  } catch (error: any) {
    console.error('Error accepting invitation:', error)
    res.status(400).json({
      success: false,
      error: { message: error.message || 'Failed to accept invitation' }
    })
  }
}

/**
 * Reject an invitation
 */
export async function rejectInvitation(req: Request, res: Response) {
  try {
    const { collaboratorId } = req.params
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      })
    }

    await CollaboratorService.rejectInvitation(collaboratorId, userId)

    res.json({
      success: true,
      data: { message: 'Invitation rejected' }
    })
  } catch (error: any) {
    console.error('Error rejecting invitation:', error)
    res.status(400).json({
      success: false,
      error: { message: error.message || 'Failed to reject invitation' }
    })
  }
}

/**
 * Update collaborator permission
 */
export async function updatePermission(req: Request, res: Response) {
  try {
    const { collaboratorId } = req.params
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      })
    }

    // Validate input
    const validation = updatePermissionSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation error',
          details: validation.error.errors
        }
      })
    }

    const { permission } = validation.data

    const updated = await CollaboratorService.updatePermission(
      { collaboratorId, permission },
      userId
    )

    res.json({
      success: true,
      data: updated
    })
  } catch (error: any) {
    console.error('Error updating permission:', error)
    res.status(400).json({
      success: false,
      error: { message: error.message || 'Failed to update permission' }
    })
  }
}

/**
 * Remove a collaborator
 */
export async function removeCollaborator(req: Request, res: Response) {
  try {
    const { collaboratorId } = req.params
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      })
    }

    await CollaboratorService.removeCollaborator(collaboratorId, userId)

    res.json({
      success: true,
      data: { message: 'Collaborator removed' }
    })
  } catch (error: any) {
    console.error('Error removing collaborator:', error)
    res.status(400).json({
      success: false,
      error: { message: error.message || 'Failed to remove collaborator' }
    })
  }
}

