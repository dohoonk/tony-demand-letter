import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import documentService, { Document, Pdf } from '../services/documentService'
import templateService, { Template } from '../services/templateService'
import { DraftEditor } from '../components/DraftEditor'
import { VersionHistory } from '../components/VersionHistory'
import api from '../services/api'
import { ensureHtmlFormat } from '../utils/textConverter'

interface Fact {
  id: string
  factText: string
  citation: string | null
  status: string
}

export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [document, setDocument] = useState<Document | null>(null)
  const [pdfs, setPdfs] = useState<Pdf[]>([])
  const [facts, setFacts] = useState<Fact[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isExtractingFacts, setIsExtractingFacts] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [draft, setDraft] = useState<string | null>(null)
  const [showTemplateSelect, setShowTemplateSelect] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)

  useEffect(() => {
    if (id) {
      loadDocument()
      loadPdfs()
      loadFacts()
      loadTemplates()
    }
  }, [id])

  const loadDocument = async () => {
    try {
      const doc = await documentService.getDocument(id!)
      setDocument(doc)
      // Load existing draft if available
      if (doc.content) {
        // Handle both string and structured content formats
        if (typeof doc.content === 'string') {
          // Ensure content is in HTML format (convert plain text if needed)
          setDraft(ensureHtmlFormat(doc.content))
        } else if (typeof doc.content === 'object' && doc.content.type === 'doc') {
          // Extract text from TipTap-style structured content
          const text = extractTextFromContent(doc.content)
          setDraft(ensureHtmlFormat(text))
        }
      }
    } catch (error) {
      console.error('Error loading document:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const extractTextFromContent = (content: any): string => {
    if (typeof content === 'string') return content
    if (!content || !content.content) return ''
    
    let text = ''
    for (const node of content.content) {
      if (node.type === 'paragraph' && node.content) {
        for (const child of node.content) {
          if (child.type === 'text' && child.text) {
            text += child.text + '\n'
          }
        }
      }
    }
    return text.trim()
  }

  const loadPdfs = async () => {
    try {
      const pdfList = await documentService.listPdfs(id!)
      setPdfs(pdfList)
    } catch (error) {
      console.error('Error loading PDFs:', error)
    }
  }

  const loadFacts = async () => {
    try {
      const response = await api.get(`/documents/${id}/facts`)
      setFacts(response.data.data)
    } catch (error) {
      console.error('Error loading facts:', error)
    }
  }

  const loadTemplates = async () => {
    try {
      const templateList = await templateService.listTemplates()
      setTemplates(templateList.filter(t => t.isActive))
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const handleApplyTemplate = async (templateId: string) => {
    try {
      await documentService.updateDocument(id!, { templateId })
      await loadDocument()
      setShowTemplateSelect(false)
      alert('Template applied successfully! Now generate your draft to use this template.')
    } catch (error) {
      console.error('Error applying template:', error)
      alert('Error applying template. Please try again.')
    }
  }

  const handleExtractFacts = async () => {
    setIsExtractingFacts(true)
    try {
      await api.post(`/documents/${id}/facts/extract`)
      await loadFacts()
      alert('Facts extracted successfully!')
    } catch (error) {
      console.error('Error extracting facts:', error)
      alert('Error extracting facts. Please try again.')
    } finally {
      setIsExtractingFacts(false)
    }
  }

  const handleApproveFact = async (factId: string) => {
    try {
      await api.post(`/documents/facts/${factId}/approve`)
      await loadFacts()
    } catch (error) {
      console.error('Error approving fact:', error)
    }
  }

  const handleRejectFact = async (factId: string) => {
    try {
      await api.post(`/documents/facts/${factId}/reject`)
      await loadFacts()
    } catch (error) {
      console.error('Error rejecting fact:', error)
    }
  }

  const handleGenerateDraft = async () => {
    setIsGenerating(true)
    try {
      const response = await api.post(`/documents/${id}/generate`)
      const draftData = response.data.data.draft
      
      // Handle both string and object responses, always convert to HTML
      if (typeof draftData === 'string') {
        setDraft(ensureHtmlFormat(draftData))
      } else if (typeof draftData === 'object') {
        // If it's a structured object, extract the text and convert to HTML
        const text = extractTextFromContent(draftData)
        setDraft(ensureHtmlFormat(text))
      }
      
      alert('Draft generated successfully!')
    } catch (error: any) {
      console.error('Error generating draft:', error)
      alert(error.response?.data?.error?.message || 'Error generating draft')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!draft) return
    
    try {
      // Update document
      await documentService.updateDocument(id!, {
        content: draft,
        status: 'draft'
      })
      
      // Create version
      await api.post(`/documents/${id}/versions`, {
        content: draft,
        note: 'Manual save'
      })
      
      await loadDocument()
      alert('Draft saved and version created successfully!')
    } catch (error) {
      console.error('Error saving draft:', error)
      alert('Error saving draft. Please try again.')
    }
  }

  const handleSaveFromEditor = async (content: string) => {
    try {
      // Update document
      await documentService.updateDocument(id!, {
        content,
        status: 'draft'
      })
      
      // Create version
      await api.post(`/documents/${id}/versions`, {
        content,
        note: 'Saved from editor'
      })
      
      setDraft(content)
      setIsEditing(false)
      await loadDocument()
    } catch (error) {
      console.error('Error saving from editor:', error)
      throw error
    }
  }

  const handleVersionRestore = () => {
    // Reload document to get the restored content
    loadDocument()
    setIsEditing(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)

    try {
      // Upload files one by one
      for (const file of Array.from(files)) {
        await documentService.uploadPdf(id!, file)
      }
      
      // Reload PDFs
      await loadPdfs()
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error uploading PDFs:', error)
      alert('Error uploading PDF. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeletePdf = async (pdfId: string) => {
    if (!confirm('Are you sure you want to delete this PDF?')) return

    try {
      await documentService.deletePdf(pdfId)
      await loadPdfs()
    } catch (error) {
      console.error('Error deleting PDF:', error)
    }
  }

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes)
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!document) {
    return <div className="flex items-center justify-center min-h-screen">Document not found</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/documents')}
          className="text-blue-600 hover:text-blue-700 mb-4"
        >
          ← Back to Documents
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{document.title}</h1>
            <p className="text-gray-600 mt-2">
              Created {new Date(document.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={() => setShowTemplateSelect(!showTemplateSelect)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            📋 {document.templateId ? 'Change Template' : 'Apply Template'}
          </button>
        </div>
      </div>

      {/* Template Selection */}
      {showTemplateSelect && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Select a Template</h2>
          {templates.length === 0 ? (
            <p className="text-gray-600">
              No templates available. Create a template first.
            </p>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                    {template.description && (
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    )}
                    {template.category && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {template.category}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleApplyTemplate(template.id)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    Apply
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowTemplateSelect(false)}
            className="mt-4 text-gray-600 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      )}

      {/* PDF Upload Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Case Documents</h2>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isUploading ? 'Uploading...' : '+ Upload PDF'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {pdfs.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-600 mb-4">No PDFs uploaded yet</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Upload your first PDF
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {pdfs.map((pdf) => (
              <div
                key={pdf.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="text-red-600">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h10l4 4v16H2v-1z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{pdf.filename}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(pdf.fileSizeBytes)}
                      {pdf.pageCount && ` • ${pdf.pageCount} pages`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeletePdf(pdf.id)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Facts Section */}
      {pdfs.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Extracted Facts</h2>
            <button
              onClick={handleExtractFacts}
              disabled={isExtractingFacts}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              {isExtractingFacts ? 'Extracting...' : '🤖 Extract Facts with AI'}
            </button>
          </div>

          {facts.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-600 mb-4">No facts extracted yet</p>
              <button
                onClick={handleExtractFacts}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Extract facts from uploaded PDFs
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {facts.map((fact) => (
                <div
                  key={fact.id}
                  className={`p-4 border rounded-lg ${
                    fact.status === 'approved'
                      ? 'border-green-200 bg-green-50'
                      : fact.status === 'rejected'
                      ? 'border-red-200 bg-red-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-gray-900 flex-1">{fact.factText}</p>
                    <div className="flex gap-2 ml-4">
                      {fact.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproveFact(fact.id)}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleRejectFact(fact.id)}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            ✗ Reject
                          </button>
                        </>
                      )}
                      {fact.status === 'approved' && (
                        <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded">
                          Approved
                        </span>
                      )}
                      {fact.status === 'rejected' && (
                        <span className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded">
                          Rejected
                        </span>
                      )}
                    </div>
                  </div>
                  {fact.citation && (
                    <p className="text-xs text-gray-500">{fact.citation}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Generate Draft Button */}
      {facts.some(f => f.status === 'approved') && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <button
            onClick={handleGenerateDraft}
            disabled={isGenerating}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
          >
            {isGenerating ? 'Generating Draft...' : '✨ Generate Demand Letter Draft'}
          </button>
        </div>
      )}

      {/* Draft Display */}
      {draft && (
        <div className="bg-white rounded-lg shadow p-6">
          {isEditing ? (
            <DraftEditor
              initialContent={draft}
              documentId={id!}
              onSave={handleSaveFromEditor}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Demand Letter Draft</h2>
                  {document?.content && (
                    <p className="text-sm text-gray-600 mt-1">✓ Saved version available</p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowVersionHistory(!showVersionHistory)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    📜 Version History
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    ✏️ Edit Draft
                  </button>
                  <button
                    onClick={handleSaveDraft}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    💾 Save to Document
                  </button>
                  <a
                    href={`${import.meta.env.VITE_API_URL}/api/documents/${id}/export/docx`}
                    download
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    📄 Export to Word
                  </a>
                </div>
              </div>
              <div 
                className="prose max-w-none font-serif border-t pt-4"
                dangerouslySetInnerHTML={{ __html: draft }}
              />
            </>
          )}
        </div>
      )}

      {/* Version History */}
      {showVersionHistory && draft && (
        <div className="bg-white rounded-lg shadow p-6">
          <VersionHistory documentId={id!} onRestore={handleVersionRestore} />
        </div>
      )}
    </div>
  )
}

