import { Router } from 'express'
import documentController from '../controllers/documentController'
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

export default router

