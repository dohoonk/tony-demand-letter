import { Request, Response } from 'express'
import { z } from 'zod'
import TemplateService from '../services/TemplateService'

const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  structure: z.any(),
  variables: z.array(z.any()).optional(),
})

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  structure: z.any().optional(),
  variables: z.array(z.any()).optional(),
  isActive: z.boolean().optional(),
})

const createParagraphSchema = z.object({
  templateId: z.string().uuid().optional(),
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  tags: z.array(z.string()),
  positionHint: z.enum(['early', 'middle', 'late']).optional(),
})

const updateParagraphSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  positionHint: z.enum(['early', 'middle', 'late']).optional(),
  templateId: z.string().uuid().optional(),
})

class TemplateController {
  async createTemplate(req: Request, res: Response) {
    try {
      const validated = createTemplateSchema.parse(req.body)

      const template = await TemplateService.createTemplate({
        ...validated,
        userId: req.user!.userId,
      })

      res.status(201).json({
        data: template,
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

      console.error('Create template error:', error)
      res.status(500).json({
        error: {
          code: 'CREATE_TEMPLATE_ERROR',
          message: 'Error creating template',
        },
      })
    }
  }

  async listTemplates(req: Request, res: Response) {
    try {
      const templates = await TemplateService.listTemplates(req.user!.userId)

      res.json({
        data: templates,
      })
    } catch (error) {
      console.error('List templates error:', error)
      res.status(500).json({
        error: {
          code: 'LIST_TEMPLATES_ERROR',
          message: 'Error fetching templates',
        },
      })
    }
  }

  async getTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params

      const template = await TemplateService.getTemplate(id)

      res.json({
        data: template,
      })
    } catch (error: any) {
      if (error.message === 'Template not found') {
        return res.status(404).json({
          error: {
            code: 'TEMPLATE_NOT_FOUND',
            message: error.message,
          },
        })
      }

      console.error('Get template error:', error)
      res.status(500).json({
        error: {
          code: 'GET_TEMPLATE_ERROR',
          message: 'Error fetching template',
        },
      })
    }
  }

  async updateTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params
      const validated = updateTemplateSchema.parse(req.body)

      const template = await TemplateService.updateTemplate(id, validated)

      res.json({
        data: template,
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

      console.error('Update template error:', error)
      res.status(500).json({
        error: {
          code: 'UPDATE_TEMPLATE_ERROR',
          message: 'Error updating template',
        },
      })
    }
  }

  async deleteTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params

      await TemplateService.deleteTemplate(id)

      res.json({
        data: {
          message: 'Template deleted successfully',
        },
      })
    } catch (error) {
      console.error('Delete template error:', error)
      res.status(500).json({
        error: {
          code: 'DELETE_TEMPLATE_ERROR',
          message: 'Error deleting template',
        },
      })
    }
  }

  async createParagraph(req: Request, res: Response) {
    try {
      const validated = createParagraphSchema.parse(req.body)

      const paragraph = await TemplateService.createParagraph({
        ...validated,
        userId: req.user!.userId,
      })

      res.status(201).json({
        data: paragraph,
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

      console.error('Create paragraph error:', error)
      res.status(500).json({
        error: {
          code: 'CREATE_PARAGRAPH_ERROR',
          message: 'Error creating paragraph',
        },
      })
    }
  }

  async listParagraphs(req: Request, res: Response) {
    try {
      const { templateId } = req.query

      const paragraphs = await TemplateService.listParagraphs(
        templateId as string | undefined
      )

      res.json({
        data: paragraphs,
      })
    } catch (error) {
      console.error('List paragraphs error:', error)
      res.status(500).json({
        error: {
          code: 'LIST_PARAGRAPHS_ERROR',
          message: 'Error fetching paragraphs',
        },
      })
    }
  }

  async getParagraph(req: Request, res: Response) {
    try {
      const { id } = req.params

      const paragraph = await TemplateService.getParagraph(id)

      res.json({
        data: paragraph,
      })
    } catch (error: any) {
      if (error.message === 'Paragraph not found') {
        return res.status(404).json({
          error: {
            code: 'PARAGRAPH_NOT_FOUND',
            message: error.message,
          },
        })
      }

      console.error('Get paragraph error:', error)
      res.status(500).json({
        error: {
          code: 'GET_PARAGRAPH_ERROR',
          message: 'Error fetching paragraph',
        },
      })
    }
  }

  async updateParagraph(req: Request, res: Response) {
    try {
      const { id } = req.params
      const validated = updateParagraphSchema.parse(req.body)

      const paragraph = await TemplateService.updateParagraph(id, validated)

      res.json({
        data: paragraph,
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

      console.error('Update paragraph error:', error)
      res.status(500).json({
        error: {
          code: 'UPDATE_PARAGRAPH_ERROR',
          message: 'Error updating paragraph',
        },
      })
    }
  }

  async deleteParagraph(req: Request, res: Response) {
    try {
      const { id } = req.params

      await TemplateService.deleteParagraph(id)

      res.json({
        data: {
          message: 'Paragraph deleted successfully',
        },
      })
    } catch (error) {
      console.error('Delete paragraph error:', error)
      res.status(500).json({
        error: {
          code: 'DELETE_PARAGRAPH_ERROR',
          message: 'Error deleting paragraph',
        },
      })
    }
  }
}

export default new TemplateController()

