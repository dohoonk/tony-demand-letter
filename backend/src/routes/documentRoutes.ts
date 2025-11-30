import { Router } from 'express'
import documentController from '../controllers/documentController'
import factController from '../controllers/factController'
import exportController from '../controllers/exportController'
import versionController from '../controllers/versionController'
import { authenticate } from '../middleware/authenticate'
import { upload } from '../middleware/upload'
import { checkDocumentAccess, checkFactAccess } from '../middleware/permissions'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Document routes
router.post('/', documentController.create.bind(documentController))
router.get('/', documentController.list.bind(documentController))
router.get('/:id', checkDocumentAccess('viewer'), documentController.getOne.bind(documentController))
router.patch('/:id', checkDocumentAccess('editor'), documentController.update.bind(documentController))
router.delete('/:id', checkDocumentAccess('owner'), documentController.delete.bind(documentController))

// PDF routes
router.post('/:id/pdfs', checkDocumentAccess('editor'), upload.single('file'), documentController.uploadPdf.bind(documentController))
router.get('/:id/pdfs', checkDocumentAccess('viewer'), documentController.listPdfs.bind(documentController))
router.delete('/pdfs/:id', checkDocumentAccess('editor'), documentController.deletePdf.bind(documentController))

// Fact routes
router.post('/:documentId/facts/extract', checkDocumentAccess('editor'), factController.extractFacts.bind(factController))
router.get('/:documentId/facts', checkDocumentAccess('viewer'), factController.listFacts.bind(factController))
router.patch('/facts/:id', checkFactAccess('editor'), factController.updateFact.bind(factController))
router.post('/facts/:id/approve', checkFactAccess('editor'), factController.approveFact.bind(factController))
router.post('/facts/:id/reject', checkFactAccess('editor'), factController.rejectFact.bind(factController))
router.delete('/facts/:id', checkFactAccess('editor'), factController.deleteFact.bind(factController))

// Draft generation
router.post('/:documentId/generate', checkDocumentAccess('editor'), factController.generateDraft.bind(factController))

// Export
router.get('/:documentId/export/docx', checkDocumentAccess('viewer'), exportController.exportDocx.bind(exportController))
router.get('/:documentId/export/pdf', checkDocumentAccess('viewer'), exportController.exportPdf.bind(exportController))

// Version history
router.post('/:documentId/versions', checkDocumentAccess('editor'), versionController.createVersion.bind(versionController))
router.get('/:documentId/versions', checkDocumentAccess('viewer'), versionController.listVersions.bind(versionController))
router.get('/:documentId/versions/:versionId', checkDocumentAccess('viewer'), versionController.getVersion.bind(versionController))
router.post('/:documentId/versions/:versionId/restore', checkDocumentAccess('editor'), versionController.restoreVersion.bind(versionController))
router.delete('/:documentId/versions/:versionId', checkDocumentAccess('editor'), versionController.deleteVersion.bind(versionController))

export default router

