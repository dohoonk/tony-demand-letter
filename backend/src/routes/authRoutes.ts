import { Router } from 'express'
import authController from '../controllers/authController'
import { authenticate } from '../middleware/authenticate'

const router = Router()

// Public routes
router.post('/register', authController.register.bind(authController))
router.post('/login', authController.login.bind(authController))
router.post('/refresh', authController.refresh.bind(authController))
router.post('/logout', authController.logout.bind(authController))

// Protected routes
router.get('/me', authenticate, authController.getMe.bind(authController))

export default router

