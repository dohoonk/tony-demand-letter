import { Router } from 'express'
import { authenticateToken } from '../middleware/auth'
import * as collaboratorController from '../controllers/collaboratorController'

const router = Router()

// All routes require authentication
router.use(authenticateToken)

// Invitation management
router.get('/invitations/pending', collaboratorController.getPendingInvitations)
router.post('/invitations/:collaboratorId/accept', collaboratorController.acceptInvitation)
router.post('/invitations/:collaboratorId/reject', collaboratorController.rejectInvitation)

// Document collaborators
router.post('/documents/:documentId/collaborators', collaboratorController.inviteCollaborator)
router.get('/documents/:documentId/collaborators', collaboratorController.listCollaborators)
router.patch('/collaborators/:collaboratorId/permission', collaboratorController.updatePermission)
router.delete('/collaborators/:collaboratorId', collaboratorController.removeCollaborator)

export default router

