import { Router } from 'express'
import templateController from '../controllers/templateController'
import { authenticate } from '../middleware/authenticate'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Template routes
router.post('/', templateController.createTemplate.bind(templateController))
router.get('/', templateController.listTemplates.bind(templateController))
router.get('/:id', templateController.getTemplate.bind(templateController))
router.patch('/:id', templateController.updateTemplate.bind(templateController))
router.delete('/:id', templateController.deleteTemplate.bind(templateController))

// Paragraph routes
router.post('/paragraphs', templateController.createParagraph.bind(templateController))
router.get('/paragraphs/list', templateController.listParagraphs.bind(templateController))
router.get('/paragraphs/:id', templateController.getParagraph.bind(templateController))
router.patch('/paragraphs/:id', templateController.updateParagraph.bind(templateController))
router.delete('/paragraphs/:id', templateController.deleteParagraph.bind(templateController))

export default router

