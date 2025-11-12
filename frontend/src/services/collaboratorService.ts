import api from './api'

export interface Collaborator {
  id: string
  documentId: string
  userId: string
  permission: 'owner' | 'editor' | 'viewer'
  status: 'pending' | 'accepted' | 'rejected'
  invitedAt: string
  respondedAt?: string
  user: {
    id: string
    email: string
    firstName?: string
    lastName?: string
    role?: string
  }
  inviter?: {
    id: string
    email: string
    firstName?: string
    lastName?: string
  }
}

export interface Invitation extends Collaborator {
  document: {
    id: string
    title: string
    createdBy: {
      id: string
      email: string
      firstName?: string
      lastName?: string
    }
  }
}

export interface InviteInput {
  email: string
  permission: 'owner' | 'editor' | 'viewer'
}

export interface CollaboratorList {
  owner: {
    id: string
    email: string
    firstName?: string
    lastName?: string
    role?: string
  }
  collaborators: Collaborator[]
}

class CollaboratorService {
  /**
   * Invite a user to collaborate on a document
   */
  async inviteCollaborator(documentId: string, input: InviteInput): Promise<Collaborator> {
    const response = await api.post(`/collaborators/documents/${documentId}/collaborators`, input)
    return response.data.data
  }

  /**
   * List all collaborators for a document
   */
  async listCollaborators(documentId: string): Promise<CollaboratorList> {
    const response = await api.get(`/collaborators/documents/${documentId}/collaborators`)
    return response.data.data
  }

  /**
   * Get pending invitations for the current user
   */
  async getPendingInvitations(): Promise<Invitation[]> {
    const response = await api.get('/collaborators/invitations/pending')
    return response.data.data
  }

  /**
   * Accept an invitation
   */
  async acceptInvitation(collaboratorId: string): Promise<Collaborator> {
    const response = await api.post(`/collaborators/invitations/${collaboratorId}/accept`)
    return response.data.data
  }

  /**
   * Reject an invitation
   */
  async rejectInvitation(collaboratorId: string): Promise<void> {
    await api.post(`/collaborators/invitations/${collaboratorId}/reject`)
  }

  /**
   * Update collaborator permission
   */
  async updatePermission(collaboratorId: string, permission: 'owner' | 'editor' | 'viewer'): Promise<Collaborator> {
    const response = await api.patch(`/collaborators/collaborators/${collaboratorId}/permission`, { permission })
    return response.data.data
  }

  /**
   * Remove a collaborator
   */
  async removeCollaborator(collaboratorId: string): Promise<void> {
    await api.delete(`/collaborators/collaborators/${collaboratorId}`)
  }
}

export default new CollaboratorService()

