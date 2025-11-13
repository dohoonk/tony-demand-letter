import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import documentService, { Document } from '../services/documentService'
import { InvitationList } from '../components/InvitationList'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { toast } from 'sonner'
import { Plus, FileText, Calendar, Search, ArrowUpDown } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'

export function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewModal, setShowNewModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'title-asc' | 'title-desc'>('date-desc')

  useEffect(() => {
    console.log('[DocumentsPage] useEffect: mounting, calling loadDocuments()')
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    console.log('[DocumentsPage] loadDocuments: start')
    try {
      const docs = await documentService.listDocuments()
      console.log('[DocumentsPage] loadDocuments: success', { count: docs.length })
      setDocuments(docs)
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      console.log('[DocumentsPage] loadDocuments: finished')
      setIsLoading(false)
    }
  }

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await documentService.createDocument(newTitle)
      setNewTitle('')
      setShowNewModal(false)
      loadDocuments()
      toast.success('Document created successfully!')
    } catch (error) {
      console.error('Error creating document:', error)
      toast.error('Failed to create document. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Demand Letters</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage your legal demand letters
          </p>
        </div>
        <Button onClick={() => setShowNewModal(true)} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          New Document
        </Button>
      </div>

      {/* Pending Invitations */}
      <InvitationList />

      {/* Search and Sort Controls */}
      {documents.length > 0 && (
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[200px]">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest First</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
              <SelectItem value="title-asc">Title A-Z</SelectItem>
              <SelectItem value="title-desc">Title Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No demand letters yet</CardTitle>
            <CardDescription className="mb-6 text-center max-w-sm">
              Create your first demand letter to get started with your case management
            </CardDescription>
            <Button onClick={() => setShowNewModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create your first demand letter
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents
            .filter((doc) => {
              const searchLower = searchQuery.toLowerCase()
              return (
                doc.title.toLowerCase().includes(searchLower) ||
                doc.status.toLowerCase().includes(searchLower)
              )
            })
            .sort((a, b) => {
              switch (sortBy) {
                case 'date-desc':
                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                case 'date-asc':
                  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                case 'title-asc':
                  return a.title.localeCompare(b.title)
                case 'title-desc':
                  return b.title.localeCompare(a.title)
                default:
                  return 0
              }
            })
            .map((doc) => (
            <Link key={doc.id} to={`/documents/${doc.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{doc.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Created {new Date(doc.createdAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </CardDescription>
                      <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {doc._count?.pdfs || 0} PDFs
                        </span>
                        <span>{doc._count?.facts || 0} Facts</span>
                      </div>
                    </div>
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                      {doc.status}
                    </span>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
          {documents.filter((doc) => {
            const searchLower = searchQuery.toLowerCase()
            return (
              doc.title.toLowerCase().includes(searchLower) ||
              doc.status.toLowerCase().includes(searchLower)
            )
          }).length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Search className="h-16 w-16 text-muted-foreground mb-4" />
                <CardTitle className="mb-2">No documents found</CardTitle>
                <CardDescription className="text-center max-w-sm">
                  No documents match your search for "{searchQuery}"
                </CardDescription>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* New Document Dialog */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Demand Letter</DialogTitle>
            <DialogDescription>
              Enter a title for your new demand letter document
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateDocument}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Document Title</Label>
                <Input
                  id="title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Smith v. Johnson Auto Accident"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowNewModal(false)
                  setNewTitle('')
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Create Document</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

