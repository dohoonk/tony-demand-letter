import { io, Socket } from 'socket.io-client'

class SocketService {
  private socket: Socket | null = null
  private documentId: string | null = null

  connect() {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    
    if (!this.socket || !this.socket.connected) {
      this.socket = io(backendUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
      })

      this.socket.on('connect', () => {
        console.log('✅ WebSocket connected:', this.socket?.id)
      })

      this.socket.on('disconnect', () => {
        console.log('❌ WebSocket disconnected')
      })

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error)
      })
    }

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      if (this.documentId) {
        this.socket.emit('leave-document', { documentId: this.documentId })
      }
      this.socket.disconnect()
      this.socket = null
      this.documentId = null
    }
  }

  joinDocument(documentId: string, userId: string, userName: string) {
    if (!this.socket) {
      this.connect()
    }

    this.documentId = documentId
    this.socket?.emit('join-document', {
      documentId,
      userId,
      userName,
    })
  }

  leaveDocument(documentId: string) {
    this.socket?.emit('leave-document', { documentId })
    this.documentId = null
  }

  sendDocumentUpdate(documentId: string, content: string, userId: string) {
    this.socket?.emit('document-update', {
      documentId,
      content,
      userId,
    })
  }

  sendCursorUpdate(documentId: string, position: number) {
    this.socket?.emit('cursor-update', {
      documentId,
      position,
    })
  }

  onUserJoined(callback: (data: { userId: string; userName: string }) => void) {
    this.socket?.on('user-joined', callback)
  }

  onUserLeft(callback: (data: { userId: string; userName: string }) => void) {
    this.socket?.on('user-left', callback)
  }

  onUsersList(callback: (users: { userId: string; userName: string }[]) => void) {
    this.socket?.on('users-list', callback)
  }

  onDocumentUpdated(callback: (data: { content: string; userId: string; timestamp: string }) => void) {
    this.socket?.on('document-updated', callback)
  }

  onCursorMoved(callback: (data: { userId: string; userName: string; position: number }) => void) {
    this.socket?.on('cursor-moved', callback)
  }

  offAllListeners() {
    this.socket?.off('user-joined')
    this.socket?.off('user-left')
    this.socket?.off('users-list')
    this.socket?.off('document-updated')
    this.socket?.off('cursor-moved')
  }

  getSocket(): Socket | null {
    return this.socket
  }
}

export default new SocketService()

