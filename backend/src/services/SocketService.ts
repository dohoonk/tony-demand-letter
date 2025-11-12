import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'

interface DocumentUser {
  userId: string
  userName: string
  socketId: string
  documentId: string
  cursorPosition?: number
}

class SocketService {
  private io: SocketIOServer | null = null
  private documentUsers: Map<string, DocumentUser[]> = new Map()

  initialize(server: HTTPServer) {
    const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173'
    
    this.io = new SocketIOServer(server, {
      cors: {
        origin: corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    })

    this.io.on('connection', (socket: Socket) => {
      console.log('🔌 WebSocket client connected:', socket.id)

      socket.on('join-document', (data: { documentId: string; userId: string; userName: string }) => {
        this.handleJoinDocument(socket, data)
      })

      socket.on('leave-document', (data: { documentId: string }) => {
        this.handleLeaveDocument(socket, data.documentId)
      })

      socket.on('document-update', (data: { documentId: string; content: string; userId: string }) => {
        this.handleDocumentUpdate(socket, data)
      })

      socket.on('cursor-update', (data: { documentId: string; position: number }) => {
        this.handleCursorUpdate(socket, data)
      })

      socket.on('disconnect', () => {
        console.log('🔌 WebSocket client disconnected:', socket.id)
        this.handleDisconnect(socket)
      })
    })

    console.log('✅ WebSocket server initialized')
  }

  private handleJoinDocument(socket: Socket, data: { documentId: string; userId: string; userName: string }) {
    const { documentId, userId, userName } = data

    // Join socket room for this document
    socket.join(documentId)

    // Add user to document users
    if (!this.documentUsers.has(documentId)) {
      this.documentUsers.set(documentId, [])
    }

    const users = this.documentUsers.get(documentId)!
    users.push({
      userId,
      userName,
      socketId: socket.id,
      documentId,
    })

    // Notify others in the document
    socket.to(documentId).emit('user-joined', {
      userId,
      userName,
    })

    // Send current users list to the joining user
    const activeUsers = users.map(u => ({
      userId: u.userId,
      userName: u.userName,
    }))
    socket.emit('users-list', activeUsers)

    console.log(`👤 User ${userName} joined document ${documentId}`)
  }

  private handleLeaveDocument(socket: Socket, documentId: string) {
    socket.leave(documentId)

    const users = this.documentUsers.get(documentId)
    if (users) {
      const userIndex = users.findIndex(u => u.socketId === socket.id)
      if (userIndex > -1) {
        const user = users[userIndex]
        users.splice(userIndex, 1)

        // Notify others
        socket.to(documentId).emit('user-left', {
          userId: user.userId,
          userName: user.userName,
        })

        console.log(`👤 User ${user.userName} left document ${documentId}`)
      }

      // Clean up empty document rooms
      if (users.length === 0) {
        this.documentUsers.delete(documentId)
      }
    }
  }

  private handleDocumentUpdate(socket: Socket, data: { documentId: string; content: string; userId: string }) {
    const { documentId, content, userId } = data

    // Broadcast update to all other users in the document
    socket.to(documentId).emit('document-updated', {
      content,
      userId,
      timestamp: new Date().toISOString(),
    })

    console.log(`📝 Document ${documentId} updated by user ${userId}`)
  }

  private handleCursorUpdate(socket: Socket, data: { documentId: string; position: number }) {
    const { documentId, position } = data

    const users = this.documentUsers.get(documentId)
    if (users) {
      const user = users.find(u => u.socketId === socket.id)
      if (user) {
        user.cursorPosition = position

        // Broadcast cursor position to others
        socket.to(documentId).emit('cursor-moved', {
          userId: user.userId,
          userName: user.userName,
          position,
        })
      }
    }
  }

  private handleDisconnect(socket: Socket) {
    // Find and remove user from all documents
    for (const [documentId, users] of this.documentUsers.entries()) {
      const userIndex = users.findIndex(u => u.socketId === socket.id)
      if (userIndex > -1) {
        const user = users[userIndex]
        users.splice(userIndex, 1)

        // Notify others
        socket.to(documentId).emit('user-left', {
          userId: user.userId,
          userName: user.userName,
        })

        console.log(`👤 User ${user.userName} disconnected from document ${documentId}`)

        if (users.length === 0) {
          this.documentUsers.delete(documentId)
        }
      }
    }
  }

  getIO(): SocketIOServer | null {
    return this.io
  }
}

export default new SocketService()

