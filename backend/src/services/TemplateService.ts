import prisma from '../config/database'

export interface CreateTemplateInput {
  name: string
  description?: string
  category?: string
  structure?: any
  variables?: any
  userId: string
}

export interface CreateParagraphInput {
  templateId?: string
  title: string
  content: string
  tags: string[]
  positionHint?: string
  userId: string
}

class TemplateService {
  async createTemplate(input: CreateTemplateInput) {
    const template = await prisma.template.create({
      data: {
        name: input.name,
        description: input.description,
        category: input.category,
        structure: input.structure,
        variables: input.variables || [],
        createdById: input.userId,
      },
    })

    return template
  }

  async listTemplates(userId: string) {
    const templates = await prisma.template.findMany({
      where: {
        isActive: true,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            paragraphModules: true,
            documents: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return templates
  }

  async getTemplate(id: string) {
    const template = await prisma.template.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        paragraphModules: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!template) {
      throw new Error('Template not found')
    }

    return template
  }

  async updateTemplate(id: string, data: any) {
    const template = await prisma.template.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    })

    return template
  }

  async deleteTemplate(id: string) {
    await prisma.template.update({
      where: { id },
      data: { isActive: false },
    })
  }

  async createParagraph(input: CreateParagraphInput) {
    const paragraph = await prisma.paragraphModule.create({
      data: {
        templateId: input.templateId,
        title: input.title,
        content: input.content,
        tags: input.tags,
        positionHint: input.positionHint,
        createdById: input.userId,
      },
    })

    return paragraph
  }

  async listParagraphs(templateId?: string) {
    const paragraphs = await prisma.paragraphModule.findMany({
      where: templateId ? { templateId } : {},
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return paragraphs
  }

  async getParagraph(id: string) {
    const paragraph = await prisma.paragraphModule.findUnique({
      where: { id },
      include: {
        template: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!paragraph) {
      throw new Error('Paragraph not found')
    }

    return paragraph
  }

  async updateParagraph(id: string, data: any) {
    const paragraph = await prisma.paragraphModule.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    })

    return paragraph
  }

  async deleteParagraph(id: string) {
    await prisma.paragraphModule.delete({
      where: { id },
    })
  }
}

export default new TemplateService()

