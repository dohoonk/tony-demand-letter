import { useState } from 'react'

interface DraftEditorProps {
  initialContent: string
  documentId: string
  onSave: (content: string) => void
  onCancel?: () => void
}

export function DraftEditor({ initialContent, documentId, onSave, onCancel }: DraftEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(content)
      alert('Draft saved successfully!')
    } catch (error) {
      alert('Error saving draft')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Edit Draft</h2>
        <div className="flex gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSaving ? 'Saving...' : '💾 Save Draft'}
          </button>
        </div>
      </div>
      
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-[600px] p-4 border border-gray-300 rounded-md font-serif text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Edit your demand letter here..."
      />
      
      <div className="text-sm text-gray-500">
        {content.length} characters
      </div>
    </div>
  )
}

