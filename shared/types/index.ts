/**
 * Shared TypeScript types across frontend and backend
 */

// User types
export interface User {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: 'attorney' | 'paralegal' | 'viewer'
  createdAt: string
  updatedAt: string
}

// Document types
export interface Document {
  id: string
  title: string
  createdById: string
  templateId: string | null
  status: 'draft' | 'in_review' | 'finalized'
  content: any | null
  metadata: any | null
  createdAt: string
  updatedAt: string
}

// PDF types
export interface Pdf {
  id: string
  documentId: string
  filename: string
  s3Key: string
  fileSizeBytes: number
  mimeType: string
  extractedText: string | null
  pageCount: number | null
  uploadedById: string
  createdAt: string
}

// Fact types
export interface Fact {
  id: string
  documentId: string
  pdfId: string | null
  factText: string
  citation: string | null
  pageNumber: number | null
  status: 'pending' | 'approved' | 'rejected' | 'edited'
  originalText: string | null
  reviewedById: string | null
  reviewedAt: string | null
  createdAt: string
}

// Template types
export interface Template {
  id: string
  name: string
  description: string | null
  category: string | null
  structure: any
  variables: any | null
  createdById: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Paragraph Module types
export interface ParagraphModule {
  id: string
  templateId: string | null
  title: string
  content: string
  tags: string[]
  positionHint: string | null
  createdById: string
  createdAt: string
  updatedAt: string
}

// Version types
export interface DocumentVersion {
  id: string
  documentId: string
  versionNumber: number
  content: any
  createdById: string
  createdAt: string
}

// Audit Log types
export interface AuditLog {
  id: string
  userId: string | null
  documentId: string | null
  action: string
  metadata: any | null
  ipAddress: string | null
  createdAt: string
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: ApiError
}

export interface ApiError {
  code: string
  message: string
  details?: any
}

// Authentication types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface AuthResponse {
  user: User
  accessToken: string
}

