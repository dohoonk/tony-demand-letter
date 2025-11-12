import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import documentService, { Document, Pdf } from '../services/documentService'
import templateService, { Template } from '../services/templateService'
import { DraftEditor } from '../components/DraftEditor'
import { VersionHistory } from '../components/VersionHistory'
import { CollaboratorManagement } from '../components/CollaboratorManagement'
import api from '../services/api'
import { ensureHtmlFormat } from '../utils/textConverter'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog'
import { toast } from 'sonner'
import { ArrowLeft, Upload, FileText, Sparkles, Save, Download, Edit, History, Users, FileCheck, X, CheckCircle, XCircle, Layout } from 'lucide-react'

interface Fact {
  id: string
  factText: string
  citation: string | null
  status: string
}

export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [document, setDocument] = useState<Document | null>(null)
  const [pdfs, setPdfs] = useState<Pdf[]>([])
  const [facts, setFacts] = useState<Fact[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isExtractingFacts, setIsExtractingFacts] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [draft, setDraft] = useState<string | null>(null)
  const [showTemplateSelect, setShowTemplateSelect] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [showCollaborators, setShowCollaborators] = useState(false)
  const [userPermission, setUserPermission] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadDocument()
      loadPdfs()
      loadFacts()
      loadTemplates()
    }
  }, [id])

  const loadDocument = async () => {
    try {
      const doc = await documentService.getDocument(id!)
      setDocument(doc)
      
      // Extract user's permission from document data
      // The backend includes collaborators field with user's permission
      if (doc.collaborators && doc.collaborators.length > 0) {
        setUserPermission(doc.collaborators[0].permission)
      } else {
        // If user is the creator, they have owner permission
        setUserPermission('owner')
      }
      
      // Load existing draft if available
      if (doc.content) {
        // Handle both string and structured content formats
        if (typeof doc.content === 'string') {
          // Ensure content is in HTML format (convert plain text if needed)
          setDraft(ensureHtmlFormat(doc.content))
        } else if (typeof doc.content === 'object' && doc.content.type === 'doc') {
          // Extract text from TipTap-style structured content
          const text = extractTextFromContent(doc.content)
          setDraft(ensureHtmlFormat(text))
        }
      }
    } catch (error) {
      console.error('Error loading document:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const extractTextFromContent = (content: any): string => {
    if (typeof content === 'string') return content
    if (!content || !content.content) return ''
    
    let text = ''
    for (const node of content.content) {
      if (node.type === 'paragraph' && node.content) {
        for (const child of node.content) {
          if (child.type === 'text' && child.text) {
            text += child.text + '\n'
          }
        }
      }
    }
    return text.trim()
  }

  const loadPdfs = async () => {
    try {
      const pdfList = await documentService.listPdfs(id!)
      setPdfs(pdfList)
    } catch (error) {
      console.error('Error loading PDFs:', error)
    }
  }

  const loadFacts = async () => {
    try {
      const response = await api.get(`/documents/${id}/facts`)
      setFacts(response.data.data)
    } catch (error) {
      console.error('Error loading facts:', error)
    }
  }

  const loadTemplates = async () => {
    try {
      const templateList = await templateService.listTemplates()
      setTemplates(templateList.filter(t => t.isActive))
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const handleApplyTemplate = async (templateId: string) => {
    try {
      await documentService.updateDocument(id!, { templateId })
      await loadDocument()
      setShowTemplateSelect(false)
      toast.success('Template applied successfully! Generate your draft to use this template.')
    } catch (error) {
      console.error('Error applying template:', error)
      toast.error('Failed to apply template. Please try again.')
    }
  }

  const handleExtractFacts = async () => {
    setIsExtractingFacts(true)
    try {
      await api.post(`/documents/${id}/facts/extract`)
      await loadFacts()
      toast.success('Facts extracted successfully!')
    } catch (error) {
      console.error('Error extracting facts:', error)
      toast.error('Failed to extract facts. Please try again.')
    } finally {
      setIsExtractingFacts(false)
    }
  }

  const handleApproveFact = async (factId: string) => {
    try {
      await api.post(`/documents/facts/${factId}/approve`)
      await loadFacts()
    } catch (error) {
      console.error('Error approving fact:', error)
    }
  }

  const handleRejectFact = async (factId: string) => {
    try {
      await api.post(`/documents/facts/${factId}/reject`)
      await loadFacts()
    } catch (error) {
      console.error('Error rejecting fact:', error)
    }
  }

  const handleGenerateDraft = async () => {
    setIsGenerating(true)
    try {
      const response = await api.post(`/documents/${id}/generate`)
      const draftData = response.data.data.draft
      
      // Handle both string and object responses, always convert to HTML
      if (typeof draftData === 'string') {
        setDraft(ensureHtmlFormat(draftData))
      } else if (typeof draftData === 'object') {
        // If it's a structured object, extract the text and convert to HTML
        const text = extractTextFromContent(draftData)
        setDraft(ensureHtmlFormat(text))
      }
      
      toast.success('Draft generated successfully!')
    } catch (error: any) {
      console.error('Error generating draft:', error)
      toast.error(error.response?.data?.error?.message || 'Failed to generate draft')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!draft) return
    
    try {
      // Update document
      await documentService.updateDocument(id!, {
        content: draft,
        status: 'draft'
      })
      
      // Create version
      await api.post(`/documents/${id}/versions`, {
        content: draft,
        note: 'Manual save'
      })
      
      await loadDocument()
      toast.success('Draft saved and version created successfully!')
    } catch (error) {
      console.error('Error saving draft:', error)
      toast.error('Failed to save draft. Please try again.')
    }
  }

  const handleExportDocx = async () => {
    try {
      const response = await api.get(`/documents/${id}/export/docx`, {
        responseType: 'blob',
      })

      // Create a blob URL and trigger download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })
      const url = window.URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = url
      link.download = `${document?.title || 'demand-letter'}.docx`
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('Error exporting document:', error)
      console.error('Error response:', error.response)
      console.error('Error data:', error.response?.data)
      
      // If the error response is a blob, try to read it as text
      if (error.response?.data instanceof Blob) {
        const text = await error.response.data.text()
        console.error('Error blob text:', text)
        try {
          const errorData = JSON.parse(text)
          toast.error(errorData.error?.message || 'Error exporting document')
        } catch {
          toast.error('Error exporting document: ' + text)
        }
      } else {
        toast.error(error.response?.data?.error?.message || error.message || 'Error exporting document')
      }
    }
  }

  const handleSaveFromEditor = async (content: string) => {
    try {
      // Update document
      await documentService.updateDocument(id!, {
        content,
        status: 'draft'
      })
      
      // Create version
      await api.post(`/documents/${id}/versions`, {
        content,
        note: 'Saved from editor'
      })
      
      setDraft(content)
      setIsEditing(false)
      await loadDocument()
    } catch (error) {
      console.error('Error saving from editor:', error)
      throw error
    }
  }

  const handleVersionRestore = () => {
    // Reload document to get the restored content
    loadDocument()
    setIsEditing(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)

    try {
      // Upload files one by one
      for (const file of Array.from(files)) {
        await documentService.uploadPdf(id!, file)
      }
      
      // Reload PDFs
      await loadPdfs()
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error uploading PDFs:', error)
      toast.error('Failed to upload PDF. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeletePdf = async (pdfId: string) => {
    try {
      await documentService.deletePdf(pdfId)
      await loadPdfs()
      toast.success('PDF deleted successfully')
    } catch (error) {
      console.error('Error deleting PDF:', error)
      toast.error('Failed to delete PDF')
    }
  }

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes)
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-8" />
        <div className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">Document not found</CardTitle>
            <CardDescription>The document you're looking for doesn't exist or you don't have access to it.</CardDescription>
            <Button className="mt-6" onClick={() => navigate('/documents')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Documents
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/documents')}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Documents
        </Button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{document.title}</h1>
            <p className="text-muted-foreground mt-2 flex items-center gap-3">
              <span>Created {new Date(document.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}</span>
              {userPermission && (
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary rounded-full">
                  {userPermission}
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCollaborators(!showCollaborators)}
            >
              <Users className="mr-2 h-4 w-4" />
              Manage Collaborators
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowTemplateSelect(!showTemplateSelect)}
            >
              <Layout className="mr-2 h-4 w-4" />
              {document.templateId ? 'Change Template' : 'Apply Template'}
            </Button>
          </div>
        </div>
      </div>

      {/* Template Selection */}
      {showTemplateSelect && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select a Template</CardTitle>
            <CardDescription>
              Choose a template to structure your demand letter
            </CardDescription>
          </CardHeader>
          <CardContent>
            {templates.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No templates available. Create a template first.
              </p>
            ) : (
              <div className="space-y-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div>
                      <h3 className="font-medium">{template.name}</h3>
                      {template.description && (
                        <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                      )}
                      {template.category && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs bg-primary/10 text-primary rounded-md">
                          {template.category}
                        </span>
                      )}
                    </div>
                    <Button onClick={() => handleApplyTemplate(template.id)}>
                      Apply
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Button
              variant="ghost"
              onClick={() => setShowTemplateSelect(false)}
              className="mt-4"
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Collaborator Management */}
      {showCollaborators && (
        <CollaboratorManagement documentId={id!} userPermission={userPermission} />
      )}

      {/* PDF Upload Section */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Case Documents</CardTitle>
              <CardDescription>Upload PDF files containing case information</CardDescription>
            </div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? 'Uploading...' : 'Upload PDF'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </CardHeader>
        <CardContent>
          {pdfs.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No PDFs uploaded yet</p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload your first PDF
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {pdfs.map((pdf) => (
                <div
                  key={pdf.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-destructive" />
                    <div>
                      <p className="font-medium">{pdf.filename}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(pdf.fileSizeBytes)}
                        {pdf.pageCount && ` • ${pdf.pageCount} pages`}
                      </p>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <X className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete PDF?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{pdf.filename}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeletePdf(pdf.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Facts Section */}
      {pdfs.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Extracted Facts</CardTitle>
                <CardDescription>AI-extracted facts from your case documents</CardDescription>
              </div>
              <Button
                onClick={handleExtractFacts}
                disabled={isExtractingFacts}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {isExtractingFacts ? 'Extracting...' : 'Extract Facts with AI'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {facts.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No facts extracted yet</p>
                <Button
                  variant="outline"
                  onClick={handleExtractFacts}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Extract facts from uploaded PDFs
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {facts.map((fact) => (
                  <div
                    key={fact.id}
                    className={`p-4 border rounded-lg ${
                      fact.status === 'approved'
                        ? 'border-green-200 bg-green-50 dark:bg-green-950'
                        : fact.status === 'rejected'
                        ? 'border-red-200 bg-red-50 dark:bg-red-950'
                        : 'bg-card'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="flex-1">{fact.factText}</p>
                      <div className="flex gap-2 ml-4">
                        {fact.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApproveFact(fact.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectFact(fact.id)}
                            >
                              <XCircle className="mr-1 h-3 w-3" />
                              Reject
                            </Button>
                          </>
                        )}
                        {fact.status === 'approved' && (
                          <span className="px-3 py-1 text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 rounded-md flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Approved
                          </span>
                        )}
                        {fact.status === 'rejected' && (
                          <span className="px-3 py-1 text-sm bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 rounded-md flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            Rejected
                          </span>
                        )}
                      </div>
                    </div>
                    {fact.citation && (
                      <p className="text-xs text-muted-foreground">{fact.citation}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Generate Draft Button */}
      {facts.some(f => f.status === 'approved') && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Button
              onClick={handleGenerateDraft}
              disabled={isGenerating}
              className="w-full h-12 text-base"
              size="lg"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              {isGenerating ? 'Generating Draft...' : 'Generate Demand Letter Draft'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Draft Display */}
      {draft && (
        <Card>
          {isEditing ? (
            <CardContent className="p-0">
              <DraftEditor
                initialContent={draft}
                documentId={id!}
                onSave={handleSaveFromEditor}
                onCancel={() => setIsEditing(false)}
              />
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Demand Letter Draft</CardTitle>
                    {document?.content && (
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <FileCheck className="h-4 w-4" />
                        Saved version available
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowVersionHistory(!showVersionHistory)}
                    >
                      <History className="mr-2 h-4 w-4" />
                      Version History
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Draft
                    </Button>
                    <Button
                      variant="default"
                      onClick={handleSaveDraft}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save to Document
                    </Button>
                    <Button
                      variant="default"
                      onClick={handleExportDocx}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export to Word
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-slate max-w-none font-serif"
                  dangerouslySetInnerHTML={{ __html: draft }}
                />
              </CardContent>
            </>
          )}
        </Card>
      )}

      {/* Version History */}
      {showVersionHistory && draft && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Version History</CardTitle>
            <CardDescription>View and restore previous versions of your draft</CardDescription>
          </CardHeader>
          <CardContent>
            <VersionHistory documentId={id!} onRestore={handleVersionRestore} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

