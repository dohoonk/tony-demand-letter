import { Router } from 'express'
import authRoutes from './authRoutes'
import documentRoutes from './documentRoutes'
import templateRoutes from './templateRoutes'
import collaboratorRoutes from './collaboratorRoutes'

const router = Router()

// Mount routes
router.use('/auth', authRoutes)
router.use('/documents', documentRoutes)
router.use('/templates', templateRoutes)
router.use('/collaborators', collaboratorRoutes)

export default router

