import { Router } from 'express'
import documentController from '../controllers/documentController'
import factController from '../controllers/factController'
import exportController from '../controllers/exportController'
import versionController from '../controllers/versionController'
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

// Export
router.get('/:documentId/export/docx', exportController.exportDocx.bind(exportController))

// Version history
router.post('/:documentId/versions', versionController.createVersion.bind(versionController))
router.get('/:documentId/versions', versionController.listVersions.bind(versionController))
router.get('/:documentId/versions/:versionId', versionController.getVersion.bind(versionController))
router.post('/:documentId/versions/:versionId/restore', versionController.restoreVersion.bind(versionController))
router.delete('/:documentId/versions/:versionId', versionController.deleteVersion.bind(versionController))

export default router

