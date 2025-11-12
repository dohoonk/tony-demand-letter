import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import collaboratorService, { Invitation } from '../services/collaboratorService'

export function InvitationList() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadInvitations()
  }, [])

  const loadInvitations = async () => {
    try {
      setLoading(true)
      const data = await collaboratorService.getPendingInvitations()
      setInvitations(data)
    } catch (error) {
      console.error('Error loading invitations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (invitation: Invitation) => {
    try {
      await collaboratorService.acceptInvitation(invitation.id)
      alert(`You've joined "${invitation.document.title}"!`)
      // Reload invitations
      await loadInvitations()
      // Navigate to the document
      navigate(`/documents/${invitation.documentId}`)
    } catch (error: any) {
      console.error('Error accepting invitation:', error)
      alert(error.response?.data?.error?.message || 'Failed to accept invitation')
    }
  }

  const handleReject = async (invitation: Invitation) => {
    if (!confirm(`Reject invitation to "${invitation.document.title}"?`)) {
      return
    }

    try {
      await collaboratorService.rejectInvitation(invitation.id)
      alert('Invitation rejected')
      await loadInvitations()
    } catch (error: any) {
      console.error('Error rejecting invitation:', error)
      alert(error.response?.data?.error?.message || 'Failed to reject invitation')
    }
  }

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

  if (loading) {
    return <div className="text-center py-4">Loading invitations...</div>
  }

  if (invitations.length === 0) {
    return null
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">📬</span>
        <h2 className="text-xl font-semibold">Pending Invitations ({invitations.length})</h2>
      </div>
      <div className="space-y-3">
        {invitations.map((invitation) => (
          <div key={invitation.id} className="bg-white p-4 rounded-md border border-yellow-300">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{invitation.document.title}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  {invitation.inviter
                    ? `${invitation.inviter.firstName || invitation.inviter.email} invited you to collaborate`
                    : `${invitation.document.createdBy.firstName || invitation.document.createdBy.email} invited you to collaborate`}
                </p>
                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getPermissionBadgeColor(invitation.permission)}`}>
                  {invitation.permission} access
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAccept(invitation)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleReject(invitation)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

