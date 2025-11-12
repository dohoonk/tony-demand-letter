import { Router } from 'express'
import firmSettingsController from '../controllers/firmSettingsController'
import { authenticate } from '../middleware/authenticate'

const router = Router()

// All routes require authentication
router.use(authenticate)

// GET /api/settings/firm - Get firm settings
router.get('/', firmSettingsController.getFirmSettings.bind(firmSettingsController))

// PUT /api/settings/firm - Update firm settings
router.put('/', firmSettingsController.updateFirmSettings.bind(firmSettingsController))

export default router

