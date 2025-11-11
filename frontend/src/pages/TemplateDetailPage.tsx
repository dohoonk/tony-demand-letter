import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import templateService, { Template, Paragraph } from '../services/templateService'

export function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [template, setTemplate] = useState<Template | null>(null)
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showParagraphModal, setShowParagraphModal] = useState(false)
  const [paragraphForm, setParagraphForm] = useState({
    title: '',
    content: '',
    tags: '',
    positionHint: 'middle' as 'early' | 'middle' | 'late',
  })

  useEffect(() => {
    if (id) {
      loadTemplate()
      loadParagraphs()
    }
  }, [id])

  const loadTemplate = async () => {
    try {
      const data = await templateService.getTemplate(id!)
      setTemplate(data)
    } catch (error) {
      console.error('Error loading template:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadParagraphs = async () => {
    try {
      const data = await templateService.listParagraphs(id!)
      setParagraphs(data)
    } catch (error) {
      console.error('Error loading paragraphs:', error)
    }
  }

  const handleCreateParagraph = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await templateService.createParagraph({
        templateId: id,
        title: paragraphForm.title,
        content: paragraphForm.content,
        tags: paragraphForm.tags.split(',').map(t => t.trim()).filter(t => t),
        positionHint: paragraphForm.positionHint,
      })
      setParagraphForm({ title: '', content: '', tags: '', positionHint: 'middle' })
      setShowParagraphModal(false)
      loadParagraphs()
    } catch (error) {
      console.error('Error creating paragraph:', error)
    }
  }

  const handleDeleteParagraph = async (paragraphId: string) => {
    if (!confirm('Are you sure you want to delete this paragraph?')) return
    try {
      await templateService.deleteParagraph(paragraphId)
      loadParagraphs()
    } catch (error) {
      console.error('Error deleting paragraph:', error)
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!template) {
    return <div className="flex items-center justify-center min-h-screen">Template not found</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/templates')}
          className="text-blue-600 hover:text-blue-700 mb-4"
        >
          ← Back to Templates
        </button>
        <h1 className="text-3xl font-bold text-gray-900">{template.name}</h1>
        {template.description && (
          <p className="text-gray-600 mt-2">{template.description}</p>
        )}
        {template.category && (
          <span className="inline-block mt-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded">
            {template.category}
          </span>
        )}
      </div>

      {/* Paragraph Modules */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Paragraph Modules</h2>
          <button
            onClick={() => setShowParagraphModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + Add Paragraph
          </button>
        </div>

        {paragraphs.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-600 mb-4">No paragraph modules yet</p>
            <button
              onClick={() => setShowParagraphModal(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Add your first paragraph module
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {paragraphs.map((paragraph) => (
              <div
                key={paragraph.id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{paragraph.title}</h3>
                  <button
                    onClick={() => handleDeleteParagraph(paragraph.id)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                  {paragraph.content}
                </p>
                <div className="flex gap-2">
                  {paragraph.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {paragraph.positionHint && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      {paragraph.positionHint}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Paragraph Modal */}
      {showParagraphModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">New Paragraph Module</h2>
            <form onSubmit={handleCreateParagraph}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={paragraphForm.title}
                    onChange={(e) => setParagraphForm({ ...paragraphForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="e.g., Liability - Clear Fault"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <textarea
                    value={paragraphForm.content}
                    onChange={(e) => setParagraphForm({ ...paragraphForm, content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                    rows={8}
                    placeholder="Enter paragraph content here..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={paragraphForm.tags}
                    onChange={(e) => setParagraphForm({ ...paragraphForm, tags: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="auto_accident, rear_end, liability"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position Hint
                  </label>
                  <select
                    value={paragraphForm.positionHint}
                    onChange={(e) => setParagraphForm({ ...paragraphForm, positionHint: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="early">Early</option>
                    <option value="middle">Middle</option>
                    <option value="late">Late</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowParagraphModal(false)
                    setParagraphForm({ title: '', content: '', tags: '', positionHint: 'middle' })
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

