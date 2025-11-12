import prisma from '../config/database'

export interface InviteCollaboratorInput {
  documentId: string
  email: string
  permission: 'owner' | 'editor' | 'viewer'
  invitedBy: string
}

export interface UpdatePermissionInput {
  collaboratorId: string
  permission: 'owner' | 'editor' | 'viewer'
}

export class CollaboratorService {
  /**
   * Invite a user to collaborate on a document
   */
  static async inviteCollaborator(input: InviteCollaboratorInput) {
    const { documentId, email, permission, invitedBy } = input

    // Check if document exists
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { createdBy: true }
    })

    if (!document) {
      throw new Error('Document not found')
    }

    // Check if inviter has permission to invite (must be owner or editor)
    if (document.createdById !== invitedBy) {
      const inviterCollab = await prisma.documentCollaborator.findFirst({
        where: {
          documentId,
          userId: invitedBy,
          status: 'accepted',
          permission: { in: ['owner', 'editor'] }
        }
      })

      if (!inviterCollab) {
        throw new Error('You do not have permission to invite collaborators')
      }
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      throw new Error(`User with email ${email} not found`)
    }

    // Check if user is already a collaborator
    const existing = await prisma.documentCollaborator.findUnique({
      where: {
        documentId_userId: {
          documentId,
          userId: user.id
        }
      }
    })

    if (existing) {
      if (existing.status === 'accepted') {
        throw new Error('User is already a collaborator on this document')
      } else if (existing.status === 'pending') {
        throw new Error('User already has a pending invitation')
      } else {
        // Rejected - allow re-invite
        return await prisma.documentCollaborator.update({
          where: { id: existing.id },
          data: {
            permission,
            status: 'pending',
            invitedBy,
            invitedAt: new Date(),
            respondedAt: null
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            },
            inviter: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        })
      }
    }

    // Create new invitation
    const collaboration = await prisma.documentCollaborator.create({
      data: {
        documentId,
        userId: user.id,
        permission,
        status: 'pending',
        invitedBy
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        inviter: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: invitedBy,
        documentId,
        action: 'invited_collaborator',
        metadata: {
          invitedUserId: user.id,
          invitedUserEmail: email,
          permission
        }
      }
    })

    return collaboration
  }

  /**
   * List all collaborators for a document
   */
  static async listCollaborators(documentId: string, requestUserId: string) {
    // Check if user has access to document
    await this.checkAccess(documentId, requestUserId)

    const collaborators = await prisma.documentCollaborator.findMany({
      where: { documentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        },
        inviter: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: [
        { status: 'asc' }, // accepted first
        { invitedAt: 'desc' }
      ]
    })

    // Also include document owner
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    })

    return {
      owner: document?.createdBy,
      collaborators
    }
  }

  /**
   * Get pending invitations for a user
   */
  static async getPendingInvitations(userId: string) {
    return await prisma.documentCollaborator.findMany({
      where: {
        userId,
        status: 'pending'
      },
      include: {
        document: {
          include: {
            createdBy: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        inviter: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { invitedAt: 'desc' }
    })
  }

  /**
   * Accept an invitation
   */
  static async acceptInvitation(collaboratorId: string, userId: string) {
    const collaboration = await prisma.documentCollaborator.findUnique({
      where: { id: collaboratorId }
    })

    if (!collaboration) {
      throw new Error('Invitation not found')
    }

    if (collaboration.userId !== userId) {
      throw new Error('This invitation is not for you')
    }

    if (collaboration.status !== 'pending') {
      throw new Error('Invitation has already been responded to')
    }

    const updated = await prisma.documentCollaborator.update({
      where: { id: collaboratorId },
      data: {
        status: 'accepted',
        respondedAt: new Date()
      },
      include: {
        document: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId,
        documentId: collaboration.documentId,
        action: 'accepted_collaboration',
        metadata: {
          permission: collaboration.permission
        }
      }
    })

    return updated
  }

  /**
   * Reject an invitation
   */
  static async rejectInvitation(collaboratorId: string, userId: string) {
    const collaboration = await prisma.documentCollaborator.findUnique({
      where: { id: collaboratorId }
    })

    if (!collaboration) {
      throw new Error('Invitation not found')
    }

    if (collaboration.userId !== userId) {
      throw new Error('This invitation is not for you')
    }

    if (collaboration.status !== 'pending') {
      throw new Error('Invitation has already been responded to')
    }

    return await prisma.documentCollaborator.update({
      where: { id: collaboratorId },
      data: {
        status: 'rejected',
        respondedAt: new Date()
      }
    })
  }

  /**
   * Update collaborator permission
   */
  static async updatePermission(input: UpdatePermissionInput, requestUserId: string) {
    const { collaboratorId, permission } = input

    const collaboration = await prisma.documentCollaborator.findUnique({
      where: { id: collaboratorId },
      include: { document: true }
    })

    if (!collaboration) {
      throw new Error('Collaborator not found')
    }

    // Check if requester is owner or has permission
    if (collaboration.document.createdById !== requestUserId) {
      const requesterCollab = await prisma.documentCollaborator.findFirst({
        where: {
          documentId: collaboration.documentId,
          userId: requestUserId,
          status: 'accepted',
          permission: 'owner'
        }
      })

      if (!requesterCollab) {
        throw new Error('You do not have permission to update permissions')
      }
    }

    const updated = await prisma.documentCollaborator.update({
      where: { id: collaboratorId },
      data: { permission },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: requestUserId,
        documentId: collaboration.documentId,
        action: 'updated_permission',
        metadata: {
          collaboratorId,
          newPermission: permission
        }
      }
    })

    return updated
  }

  /**
   * Remove a collaborator
   */
  static async removeCollaborator(collaboratorId: string, requestUserId: string) {
    const collaboration = await prisma.documentCollaborator.findUnique({
      where: { id: collaboratorId },
      include: { document: true }
    })

    if (!collaboration) {
      throw new Error('Collaborator not found')
    }

    // Check if requester is owner or the collaborator themselves
    const isOwner = collaboration.document.createdById === requestUserId
    const isSelf = collaboration.userId === requestUserId

    if (!isOwner && !isSelf) {
      const requesterCollab = await prisma.documentCollaborator.findFirst({
        where: {
          documentId: collaboration.documentId,
          userId: requestUserId,
          status: 'accepted',
          permission: 'owner'
        }
      })

      if (!requesterCollab) {
        throw new Error('You do not have permission to remove collaborators')
      }
    }

    await prisma.documentCollaborator.delete({
      where: { id: collaboratorId }
    })

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: requestUserId,
        documentId: collaboration.documentId,
        action: 'removed_collaborator',
        metadata: {
          removedUserId: collaboration.userId
        }
      }
    })

    return { success: true }
  }

  /**
   * Check if user has access to document
   */
  static async checkAccess(
    documentId: string,
    userId: string,
    requiredPermission?: 'owner' | 'editor' | 'viewer'
  ): Promise<boolean> {
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    })

    if (!document) {
      throw new Error('Document not found')
    }

    // Document creator always has access
    if (document.createdById === userId) {
      return true
    }

    // Check collaborator permission
    const collaboration = await prisma.documentCollaborator.findFirst({
      where: {
        documentId,
        userId,
        status: 'accepted'
      }
    })

    if (!collaboration) {
      throw new Error('You do not have access to this document')
    }

    // If specific permission required, check it
    if (requiredPermission) {
      const permissionLevel = {
        owner: 3,
        editor: 2,
        viewer: 1
      }

      const userLevel = permissionLevel[collaboration.permission as keyof typeof permissionLevel]
      const requiredLevel = permissionLevel[requiredPermission]

      if (userLevel < requiredLevel) {
        throw new Error(`This action requires ${requiredPermission} permission`)
      }
    }

    return true
  }

  /**
   * Get user's permission level for a document
   */
  static async getUserPermission(documentId: string, userId: string): Promise<string | null> {
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    })

    if (!document) {
      return null
    }

    // Document creator is owner
    if (document.createdById === userId) {
      return 'owner'
    }

    // Check collaborator permission
    const collaboration = await prisma.documentCollaborator.findFirst({
      where: {
        documentId,
        userId,
        status: 'accepted'
      }
    })

    return collaboration?.permission || null
  }
}

