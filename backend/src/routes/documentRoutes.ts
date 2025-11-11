import { Router } from 'express'
import documentController from '../controllers/documentController'
import factController from '../controllers/factController'
import { authenticate } from '../middleware/authenticate'
import { upload } from '../middleware/upload'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Document routes
router.post('/', documentController.create.bind(documentController))
router.get('/', documentController.list.bind(documentController))
router.get('/:id', documentController.getOne.bind(documentController))
router.patch('/:id', documentController.update.bind(documentController))
router.delete('/:id', documentController.delete.bind(documentController))

// PDF routes
router.post('/:id/pdfs', upload.single('file'), documentController.uploadPdf.bind(documentController))
router.get('/:id/pdfs', documentController.listPdfs.bind(documentController))
router.delete('/pdfs/:id', documentController.deletePdf.bind(documentController))

// Fact routes
router.post('/:documentId/facts/extract', factController.extractFacts.bind(factController))
router.get('/:documentId/facts', factController.listFacts.bind(factController))
router.patch('/facts/:id', factController.updateFact.bind(factController))
router.post('/facts/:id/approve', factController.approveFact.bind(factController))
router.post('/facts/:id/reject', factController.rejectFact.bind(factController))
router.delete('/facts/:id', factController.deleteFact.bind(factController))

// Draft generation
router.post('/:documentId/generate', factController.generateDraft.bind(factController))

export default router

