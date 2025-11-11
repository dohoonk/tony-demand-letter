import { Request, Response } from 'express'
import { z } from 'zod'
import FactService from '../services/FactService'

const updateFactSchema = z.object({
  factText: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'edited']).optional(),
})

class FactController {
  async extractFacts(req: Request, res: Response) {
    try {
      const { documentId } = req.params

      const facts = await FactService.extractFactsFromDocument(
        documentId,
        req.user!.userId
      )

      res.json({
        data: facts,
      })
    } catch (error: any) {
      console.error('Extract facts error:', error)
      res.status(500).json({
        error: {
          code: 'EXTRACT_FACTS_ERROR',
          message: error.message || 'Error extracting facts',
        },
      })
    }
  }

  async listFacts(req: Request, res: Response) {
    try {
      const { documentId } = req.params

      const facts = await FactService.listFacts(documentId)

      res.json({
        data: facts,
      })
    } catch (error) {
      console.error('List facts error:', error)
      res.status(500).json({
        error: {
          code: 'LIST_FACTS_ERROR',
          message: 'Error fetching facts',
        },
      })
    }
  }

  async updateFact(req: Request, res: Response) {
    try {
      const { id } = req.params
      const validated = updateFactSchema.parse(req.body)

      const fact = await FactService.updateFact(id, validated, req.user!.userId)

      res.json({
        data: fact,
      })
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: error.errors,
          },
        })
      }

      console.error('Update fact error:', error)
      res.status(500).json({
        error: {
          code: 'UPDATE_FACT_ERROR',
          message: 'Error updating fact',
        },
      })
    }
  }

  async approveFact(req: Request, res: Response) {
    try {
      const { id } = req.params

      const fact = await FactService.approveFact(id, req.user!.userId)

      res.json({
        data: fact,
      })
    } catch (error) {
      console.error('Approve fact error:', error)
      res.status(500).json({
        error: {
          code: 'APPROVE_FACT_ERROR',
          message: 'Error approving fact',
        },
      })
    }
  }

  async rejectFact(req: Request, res: Response) {
    try {
      const { id } = req.params

      const fact = await FactService.rejectFact(id, req.user!.userId)

      res.json({
        data: fact,
      })
    } catch (error) {
      console.error('Reject fact error:', error)
      res.status(500).json({
        error: {
          code: 'REJECT_FACT_ERROR',
          message: 'Error rejecting fact',
        },
      })
    }
  }

  async deleteFact(req: Request, res: Response) {
    try {
      const { id } = req.params

      await FactService.deleteFact(id)

      res.json({
        data: {
          message: 'Fact deleted successfully',
        },
      })
    } catch (error) {
      console.error('Delete fact error:', error)
      res.status(500).json({
        error: {
          code: 'DELETE_FACT_ERROR',
          message: 'Error deleting fact',
        },
      })
    }
  }

  async generateDraft(req: Request, res: Response) {
    try {
      const { documentId } = req.params

      const draft = await FactService.generateDraft(documentId, req.user!.userId)

      res.json({
        data: {
          draft,
        },
      })
    } catch (error: any) {
      console.error('Generate draft error:', error)
      res.status(500).json({
        error: {
          code: 'GENERATE_DRAFT_ERROR',
          message: error.message || 'Error generating draft',
        },
      })
    }
  }
}

export default new FactController()

