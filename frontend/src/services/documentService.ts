import api from './api'

export interface Document {
  id: string
  title: string
  status: string
  content?: string | any | null
  templateId?: string | null
  createdAt: string
  createdBy: any
  _count?: {
    pdfs: number
    facts: number
  }
}

export interface Pdf {
  id: string
  filename: string
  fileSizeBytes: string
  pageCount: number | null
  createdAt: string
}

class DocumentService {
  async createDocument(title: string): Promise<Document> {
    const response = await api.post('/documents', { title })
    return response.data.data
  }

  async listDocuments(): Promise<Document[]> {
    const response = await api.get('/documents')
    return response.data.data
  }

  async getDocument(id: string): Promise<Document> {
    const response = await api.get(`/documents/${id}`)
    return response.data.data
  }

  async updateDocument(id: string, data: any): Promise<Document> {
    const response = await api.patch(`/documents/${id}`, data)
    return response.data.data
  }

  async deleteDocument(id: string): Promise<void> {
    await api.delete(`/documents/${id}`)
  }

  async uploadPdf(documentId: string, file: File): Promise<Pdf> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post(`/documents/${documentId}/pdfs`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    
    return response.data.data
  }

  async listPdfs(documentId: string): Promise<Pdf[]> {
    const response = await api.get(`/documents/${documentId}/pdfs`)
    return response.data.data
  }

  async deletePdf(id: string): Promise<void> {
    await api.delete(`/documents/pdfs/${id}`)
  }
}

export default new DocumentService()

