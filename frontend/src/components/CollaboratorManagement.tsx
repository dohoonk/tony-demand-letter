import { useState, useEffect } from 'react'
import collaboratorService, { CollaboratorList } from '../services/collaboratorService'

interface CollaboratorManagementProps {
  documentId: string
  userPermission: string | null
}

export function CollaboratorManagement({ documentId, userPermission }: CollaboratorManagementProps) {
  const [collaborators, setCollaborators] = useState<CollaboratorList | null>(null)
  const [loading, setLoading] = useState(true)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePermission, setInvitePermission] = useState<'owner' | 'editor' | 'viewer'>('viewer')
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCollaborators()
  }, [documentId])

  const loadCollaborators = async () => {
    try {
      setLoading(true)
      const data = await collaboratorService.listCollaborators(documentId)
      setCollaborators(data)
    } catch (error: any) {
      console.error('Error loading collaborators:', error)
      setError(error.response?.data?.error?.message || 'Failed to load collaborators')
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)
    setError(null)

    try {
      await collaboratorService.inviteCollaborator(documentId, {
        email: inviteEmail,
        permission: invitePermission
      })
      alert(`Invitation sent to ${inviteEmail}!`)
      setInviteEmail('')
      setInvitePermission('viewer')
      setShowInviteForm(false)
      await loadCollaborators()
    } catch (error: any) {
      console.error('Error inviting collaborator:', error)
      setError(error.response?.data?.error?.message || 'Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  const handleUpdatePermission = async (collaboratorId: string, newPermission: 'owner' | 'editor' | 'viewer') => {
    try {
      await collaboratorService.updatePermission(collaboratorId, newPermission)
      alert('Permission updated successfully!')
      await loadCollaborators()
    } catch (error: any) {
      console.error('Error updating permission:', error)
      alert(error.response?.data?.error?.message || 'Failed to update permission')
    }
  }

  const handleRemove = async (collaboratorId: string, userEmail: string) => {
    if (!confirm(`Remove ${userEmail} from this document?`)) {
      return
    }

    try {
      await collaboratorService.removeCollaborator(collaboratorId)
      alert('Collaborator removed successfully!')
      await loadCollaborators()
    } catch (error: any) {
      console.error('Error removing collaborator:', error)
      alert(error.response?.data?.error?.message || 'Failed to remove collaborator')
    }
  }

  const canInvite = userPermission === 'owner' || userPermission === 'editor'
  const canManagePermissions = userPermission === 'owner'

  const getPermissionBadgeColor = (permission: string) => {
    switch (permission) {
      case 'owner':
        return 'bg-purple-100 text-purple-800'
      case 'editor':
        return 'bg-blue-100 text-blue-800'
      case 'viewer':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading collaborators...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Collaborators</h2>
        {canInvite && (
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {showInviteForm ? 'Cancel' : '+ Invite'}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Invite Form */}
      {showInviteForm && (
        <form onSubmit={handleInvite} className="mb-6 p-4 bg-gray-50 rounded-md">
          <h3 className="text-lg font-medium mb-3">Invite Collaborator</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="colleague@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Permission Level
              </label>
              <select
                value={invitePermission}
                onChange={(e) => setInvitePermission(e.target.value as 'owner' | 'editor' | 'viewer')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="viewer">Viewer (Read-only)</option>
                <option value="editor">Editor (Can edit & collaborate)</option>
                <option value="owner">Owner (Full control)</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={inviting}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {inviting ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      )}

      {/* Owner */}
      {collaborators?.owner && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Document Owner</h3>
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-md">
            <div>
              <div className="font-medium">
                {collaborators.owner.firstName || collaborators.owner.lastName
                  ? `${collaborators.owner.firstName || ''} ${collaborators.owner.lastName || ''}`.trim()
                  : collaborators.owner.email}
              </div>
              <div className="text-sm text-gray-600">{collaborators.owner.email}</div>
            </div>
            <span className="px-3 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded-full">
              Owner
            </span>
          </div>
        </div>
      )}

      {/* Collaborators List */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Collaborators ({collaborators?.collaborators.length || 0})
        </h3>
        {collaborators?.collaborators && collaborators.collaborators.length > 0 ? (
          <div className="space-y-2">
            {collaborators.collaborators.map((collab) => (
              <div
                key={collab.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-md"
              >
                <div className="flex-1">
                  <div className="font-medium">
                    {collab.user.firstName || collab.user.lastName
                      ? `${collab.user.firstName || ''} ${collab.user.lastName || ''}`.trim()
                      : collab.user.email}
                  </div>
                  <div className="text-sm text-gray-600">{collab.user.email}</div>
                  {collab.inviter && collab.status === 'pending' && (
                    <div className="text-xs text-gray-500 mt-1">
                      Invited by {collab.inviter.email}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(collab.status)}`}>
                    {collab.status}
                  </span>
                  {collab.status === 'accepted' && (
                    <>
                      {canManagePermissions ? (
                        <select
                          value={collab.permission}
                          onChange={(e) => handleUpdatePermission(collab.id, e.target.value as 'owner' | 'editor' | 'viewer')}
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${getPermissionBadgeColor(collab.permission)} border-0 cursor-pointer`}
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                          <option value="owner">Owner</option>
                        </select>
                      ) : (
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPermissionBadgeColor(collab.permission)}`}>
                          {collab.permission}
                        </span>
                      )}
                      {canManagePermissions && (
                        <button
                          onClick={() => handleRemove(collab.id, collab.user.email)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm py-4">No collaborators yet. Invite someone to start collaborating!</p>
        )}
      </div>
    </div>
  )
}

