import { useState, useEffect, useRef } from 'react'
import socketService from '../services/socketService'
import useAuth from '../hooks/useAuth'
import { RichTextEditor } from './RichTextEditor'

interface DraftEditorProps {
  initialContent: string
  documentId: string
  onSave: (content: string) => void
  onCancel?: () => void
}

interface ActiveUser {
  userId: string
  userName: string
}

export function DraftEditor({ initialContent, documentId, onSave, onCancel }: DraftEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [isSaving, setIsSaving] = useState(false)
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const contentRef = useRef(content)
  const { user } = useAuth()

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user) return

    const socket = socketService.connect()
    setIsConnected(socket.connected)

    socket.on('connect', () => setIsConnected(true))
    socket.on('disconnect', () => setIsConnected(false))

    // Join document room
    const userName = `${user.firstName || 'User'} ${user.lastName || ''}`
    socketService.joinDocument(documentId, user.userId, userName)

    // Listen for other users
    socketService.onUsersList((users) => {
      setActiveUsers(users.filter(u => u.userId !== user.userId))
    })

    socketService.onUserJoined((data) => {
      if (data.userId !== user.userId) {
        setActiveUsers(prev => [...prev, data])
      }
    })

    socketService.onUserLeft((data) => {
      setActiveUsers(prev => prev.filter(u => u.userId !== data.userId))
    })

    // Listen for document updates from others
    socketService.onDocumentUpdated((data) => {
      if (data.userId !== user.userId) {
        setContent(data.content)
        contentRef.current = data.content
      }
    })

    // Cleanup
    return () => {
      socketService.leaveDocument(documentId)
      socketService.offAllListeners()
    }
  }, [documentId, user])

  // Update content ref when content changes
  useEffect(() => {
    contentRef.current = content
  }, [content])

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    
    // Broadcast change to other users
    if (user) {
      socketService.sendDocumentUpdate(documentId, newContent, user.userId)
    }
  }

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
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Edit Draft</h2>
          {isConnected && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm text-gray-600">Live</span>
            </div>
          )}
        </div>
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

      {/* Active Users */}
      {activeUsers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-blue-900">Currently editing:</span>
            <div className="flex gap-2">
              {activeUsers.map((user, index) => (
                <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  {user.userName}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <RichTextEditor
        content={content}
        onChange={handleContentChange}
        placeholder="Start writing your demand letter..."
      />
      
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span className="text-gray-400">Rich text editor with real-time collaboration</span>
        {isConnected ? (
          <span className="text-green-600">✓ Changes synced</span>
        ) : (
          <span className="text-gray-400">Connecting...</span>
        )}
      </div>
    </div>
  )
}

