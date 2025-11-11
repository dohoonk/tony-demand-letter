import api from './api'

export interface Template {
  id: string
  name: string
  description: string | null
  category: string | null
  structure: any
  variables: any
  isActive: boolean
  createdAt: string
}

export interface Paragraph {
  id: string
  templateId: string | null
  title: string
  content: string
  tags: string[]
  positionHint: string | null
  createdAt: string
}

class TemplateService {
  async createTemplate(data: any): Promise<Template> {
    const response = await api.post('/templates', data)
    return response.data.data
  }

  async listTemplates(): Promise<Template[]> {
    const response = await api.get('/templates')
    return response.data.data
  }

  async getTemplate(id: string): Promise<Template> {
    const response = await api.get(`/templates/${id}`)
    return response.data.data
  }

  async updateTemplate(id: string, data: any): Promise<Template> {
    const response = await api.patch(`/templates/${id}`, data)
    return response.data.data
  }

  async deleteTemplate(id: string): Promise<void> {
    await api.delete(`/templates/${id}`)
  }

  async createParagraph(data: any): Promise<Paragraph> {
    const response = await api.post('/templates/paragraphs', data)
    return response.data.data
  }

  async listParagraphs(templateId?: string): Promise<Paragraph[]> {
    const url = templateId
      ? `/templates/paragraphs/list?templateId=${templateId}`
      : '/templates/paragraphs/list'
    const response = await api.get(url)
    return response.data.data
  }

  async getParagraph(id: string): Promise<Paragraph> {
    const response = await api.get(`/templates/paragraphs/${id}`)
    return response.data.data
  }

  async updateParagraph(id: string, data: any): Promise<Paragraph> {
    const response = await api.patch(`/templates/paragraphs/${id}`, data)
    return response.data.data
  }

  async deleteParagraph(id: string): Promise<void> {
    await api.delete(`/templates/paragraphs/${id}`)
  }
}

export default new TemplateService()

