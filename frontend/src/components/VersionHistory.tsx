import { useState, useEffect } from 'react'
import api from '../services/api'

interface Version {
  id: string
  versionNumber: number
  content: any
  createdAt: string
  createdBy: {
    firstName: string
    lastName: string
  }
}

interface VersionHistoryProps {
  documentId: string
  onRestore: () => void
}

export function VersionHistory({ documentId, onRestore }: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null)

  useEffect(() => {
    loadVersions()
  }, [documentId])

  const loadVersions = async () => {
    try {
      const response = await api.get(`/documents/${documentId}/versions`)
      setVersions(response.data.data)
    } catch (error) {
      console.error('Error loading versions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestoreVersion = async (versionId: string) => {
    if (!confirm('Are you sure you want to restore this version? This will create a new version with the restored content.')) {
      return
    }

    try {
      await api.post(`/documents/${documentId}/versions/${versionId}/restore`)
      await loadVersions()
      onRestore()
      alert('Version restored successfully!')
    } catch (error) {
      console.error('Error restoring version:', error)
      alert('Error restoring version. Please try again.')
    }
  }

  const handleDeleteVersion = async (versionId: string) => {
    if (!confirm('Are you sure you want to delete this version?')) {
      return
    }

    try {
      await api.delete(`/documents/${documentId}/versions/${versionId}`)
      await loadVersions()
      if (selectedVersion?.id === versionId) {
        setSelectedVersion(null)
      }
      alert('Version deleted successfully!')
    } catch (error: any) {
      console.error('Error deleting version:', error)
      alert(error.response?.data?.error?.message || 'Error deleting version')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Loading versions...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Version History</h3>
        <span className="text-sm text-gray-600">
          {versions.length} version{versions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {versions.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          No versions yet. Save your draft to create the first version.
        </div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {versions.map((version) => (
            <div
              key={version.id}
              className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
                selectedVersion?.id === version.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      Version {version.versionNumber}
                    </span>
                    {version.versionNumber === versions[0].versionNumber && (
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {formatDate(version.createdAt)}
                  </div>
                  <div className="text-sm text-gray-600">
                    by {version.createdBy.firstName} {version.createdBy.lastName}
                  </div>
                  {version.content.note && (
                    <div className="text-sm text-gray-700 mt-2 italic">
                      "{version.content.note}"
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => setSelectedVersion(selectedVersion?.id === version.id ? null : version)}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    {selectedVersion?.id === version.id ? 'Hide' : 'Preview'}
                  </button>
                  {version.versionNumber !== versions[0].versionNumber && (
                    <>
                      <button
                        onClick={() => handleRestoreVersion(version.id)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => handleDeleteVersion(version.id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Preview */}
              {selectedVersion?.id === version.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: version.content.text || '' }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

