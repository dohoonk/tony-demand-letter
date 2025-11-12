import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import documentService, { Document } from '../services/documentService'

export function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewModal, setShowNewModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  useEffect(() => {
    console.log('[DocumentsPage] useEffect: mounting, calling loadDocuments()')
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    console.log('[DocumentsPage] loadDocuments: start')
    try {
      const docs = await documentService.listDocuments()
      console.log('[DocumentsPage] loadDocuments: success', { count: docs.length })
      setDocuments(docs)
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      console.log('[DocumentsPage] loadDocuments: finished')
      setIsLoading(false)
    }
  }

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await documentService.createDocument(newTitle)
      setNewTitle('')
      setShowNewModal(false)
      loadDocuments()
    } catch (error) {
      console.error('Error creating document:', error)
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Demand Letters</h1>
        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + New Document
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600 mb-4">No demand letters yet</p>
          <button
            onClick={() => setShowNewModal(true)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Create your first demand letter
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Link
              key={doc.id}
              to={`/documents/${doc.id}`}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{doc.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Created {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-600">
                    <span>{doc._count?.pdfs || 0} PDFs</span>
                    <span>{doc._count?.facts || 0} Facts</span>
                  </div>
                </div>
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  {doc.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* New Document Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">New Demand Letter</h2>
            <form onSubmit={handleCreateDocument}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Smith v. Johnson Auto Accident"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewModal(false)
                    setNewTitle('')
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

