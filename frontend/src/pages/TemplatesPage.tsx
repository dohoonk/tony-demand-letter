import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import templateService, { Template } from '../services/templateService'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { toast } from 'sonner'
import { Plus, LayoutTemplate, Search, ArrowUpDown } from 'lucide-react'

export function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewModal, setShowNewModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'category-asc' | 'category-desc'>('name-asc')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    variables: [] as any[],
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const data = await templateService.listTemplates()
      setTemplates(data)
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await templateService.createTemplate({
        ...formData,
        structure: {
          sections: [],
        },
      })
      setFormData({ name: '', description: '', category: '', variables: [] })
      setShowNewModal(false)
      loadTemplates()
      toast.success('Template created successfully!')
    } catch (error) {
      console.error('Error creating template:', error)
      toast.error('Failed to create template. Please try again.')
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
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage demand letter templates
          </p>
        </div>
        <Button onClick={() => setShowNewModal(true)} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Search and Sort Controls */}
      {templates.length > 0 && (
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search templates..."
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
              <SelectItem value="name-asc">Name A-Z</SelectItem>
              <SelectItem value="name-desc">Name Z-A</SelectItem>
              <SelectItem value="category-asc">Category A-Z</SelectItem>
              <SelectItem value="category-desc">Category Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <LayoutTemplate className="h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No templates yet</CardTitle>
            <CardDescription className="mb-6 text-center max-w-sm">
              Create your first template to get started
            </CardDescription>
            <Button onClick={() => setShowNewModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create your first template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates
            .filter((template) => {
              const searchLower = searchQuery.toLowerCase()
              return (
                template.name.toLowerCase().includes(searchLower) ||
                template.description?.toLowerCase().includes(searchLower) ||
                template.category?.toLowerCase().includes(searchLower)
              )
            })
            .sort((a, b) => {
              switch (sortBy) {
                case 'name-asc':
                  return a.name.localeCompare(b.name)
                case 'name-desc':
                  return b.name.localeCompare(a.name)
                case 'category-asc':
                  return (a.category || '').localeCompare(b.category || '')
                case 'category-desc':
                  return (b.category || '').localeCompare(a.category || '')
                default:
                  return 0
              }
            })
            .map((template) => (
              <Link key={template.id} to={`/templates/${template.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{template.name}</CardTitle>
                        {template.description && (
                          <CardDescription className="mt-1">{template.description}</CardDescription>
                        )}
                        {template.category && (
                          <span className="inline-block mt-3 px-2 py-1 text-xs bg-primary/10 text-primary rounded-md">
                            {template.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          {templates.filter((template) => {
            const searchLower = searchQuery.toLowerCase()
            return (
              template.name.toLowerCase().includes(searchLower) ||
              template.description?.toLowerCase().includes(searchLower) ||
              template.category?.toLowerCase().includes(searchLower)
            )
          }).length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Search className="h-16 w-16 text-muted-foreground mb-4" />
                <CardTitle className="mb-2">No templates found</CardTitle>
                <CardDescription className="text-center max-w-sm">
                  No templates match your search for "{searchQuery}"
                </CardDescription>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* New Template Dialog */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Enter details for your new demand letter template
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTemplate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Personal Injury Demand"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Template description..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Personal Injury, Contract Dispute"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowNewModal(false)
                  setFormData({ name: '', description: '', category: '', variables: [] })
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Create Template</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

