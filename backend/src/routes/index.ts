import { Router } from 'express'
import authRoutes from './authRoutes'

const router = Router()

// Mount routes
router.use('/auth', authRoutes)

export default router

