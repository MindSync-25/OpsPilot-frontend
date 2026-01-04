import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, FolderKanban, AlertCircle, Search, Clock, CheckCircle2, Pause, XCircle, Briefcase } from 'lucide-react'
import { toast } from 'sonner'
import { 
  projectService, 
  type CreateProjectRequest, 
  ProjectStatus,
} from '@/services/projectService'
import { clientService } from '@/services/clientService'
import { useUserRole } from '@/hooks/useUserRole'
import PageHeader from '@/components/common/PageHeader'
import ContentSection from '@/components/common/ContentSection'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ProjectFormDialog from '@/components/projects/ProjectFormDialog'
import OnboardingTooltip from '@/components/onboarding/OnboardingTooltip'
import { useOnboarding } from '@/contexts/OnboardingContext'

export default function Projects() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { canCreateProject, user } = useUserRole()
  const { shouldShowOnboarding, completedSteps } = useOnboarding()
  
  console.log('Current user:', user)
  console.log('User role:', user?.role)
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    clientId: '',
    sortBy: 'updatedAt',
  })

  // Fetch ALL projects (no filters on API)
  const { data: allProjects = [], isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
    retry: false,
  })

  // Client-side filtering (like Teams)
  const projects = useMemo(() => {
    let filtered = [...allProjects]

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        (p.description && p.description.toLowerCase().includes(searchLower))
      )
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status)
    }

    // Apply priority filter
    if (filters.priority) {
      filtered = filtered.filter(p => p.priority === filters.priority)
    }

    // Apply client filter
    if (filters.clientId) {
      filtered = filtered.filter(p => p.clientId === filters.clientId)
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'deadline':
        filtered.sort((a, b) => {
          if (!a.endDate) return 1
          if (!b.endDate) return -1
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
        })
        break
      default: // updatedAt
        filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        break
    }

    return filtered
  }, [allProjects, filters])
  
  console.log('Projects query result:', { allProjects, projects, isLoading, error })
  
  if (error) {
    console.error('Projects error details:', {
      message: (error as any)?.message,
      response: (error as any)?.response?.data,
      status: (error as any)?.response?.status,
    })
  }

  // Fetch clients for filter dropdown
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientService.getClients(),
  })

  // Compute status counts
  const statusCounts = useMemo(() => ({
    planning: allProjects.filter(p => p.status === ProjectStatus.PLANNING).length,
    active: allProjects.filter(p => p.status === ProjectStatus.ACTIVE).length,
    onHold: allProjects.filter(p => p.status === ProjectStatus.ON_HOLD).length,
    completed: allProjects.filter(p => p.status === ProjectStatus.COMPLETED).length,
    cancelled: allProjects.filter(p => p.status === ProjectStatus.CANCELLED).length,
  }), [allProjects])

  // Create project mutation
  const createMutation = useMutation({
    mutationFn: projectService.createProject,
    onSuccess: (data) => {
      console.log('Project created successfully:', data)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setIsCreateDialogOpen(false)
      toast.success('Project created successfully')
    },
    onError: (error: any) => {
      console.error('Failed to create project:', error)
      toast.error('Failed to create project', {
        description: error.response?.data?.message || error.message,
      })
    },
  })

  const handleCreateProject = (data: CreateProjectRequest) => {
    console.log('handleCreateProject called with:', data)
    createMutation.mutate(data)
  }

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value === 'all' ? '' : value }))
    if (key === 'search') {
      setShowSuggestions(value.length > 0)
    }
  }

  // Get search suggestions
  const suggestions = useMemo(() => {
    if (!filters.search || filters.search.length < 1) return []
    const searchLower = filters.search.toLowerCase()
    return allProjects
      .filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        (p.description && p.description.toLowerCase().includes(searchLower))
      )
      .slice(0, 5) // Show max 5 suggestions
  }, [allProjects, filters.search])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowSuggestions(false)
    if (showSuggestions) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showSuggestions])

  const getStatusVariant = (status: string) => {
    switch (status) {
      case ProjectStatus.ACTIVE: return 'default'
      case ProjectStatus.COMPLETED: return 'secondary'
      case ProjectStatus.ON_HOLD: return 'outline'
      case ProjectStatus.CANCELLED: return 'destructive'
      default: return 'outline'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-[var(--accent-danger)]'
      case 'MEDIUM': return 'text-[var(--accent-warning)]'
      case 'LOW': return 'text-[var(--accent-success)]'
      default: return 'text-muted-foreground'
    }
  }

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Unknown Client'
  }

  // Loading state
  if (isLoading) {
    return (
      <ContentSection>
        <PageHeader title="Projects" subtitle="Manage your projects" />
        <div className="space-y-4 mt-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 bg-muted/50 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </ContentSection>
    )
  }

  // Error state
  if (error) {
    return (
      <ContentSection>
        <PageHeader title="Projects" subtitle="Manage your projects" />
        <div className="mt-6 p-8 text-center bg-destructive/10 rounded-lg border border-destructive/20">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
          <p className="text-destructive font-medium">Failed to load projects</p>
          <p className="text-sm text-muted-foreground mt-2">
            {(error as any)?.response?.data?.message || (error as Error).message}
          </p>
        </div>
      </ContentSection>
    )
  }

  // Empty state - only show when NO projects exist at all
  if (!allProjects || allProjects.length === 0) {
    return (
      <ContentSection>
        <PageHeader
          title="Projects"
          subtitle="Manage your projects"
          primaryAction={
            canCreateProject() ? (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            ) : undefined
          }
        />
        <div className="mt-6 p-12 text-center bg-muted/30 rounded-lg border border-border">
          <FolderKanban className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Get started by creating your first project to organize tasks and track progress
          </p>
          {canCreateProject() && (
            <div className="relative">
              <Button onClick={() => setIsCreateDialogOpen(true)} size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Project
              </Button>
              {shouldShowOnboarding && !completedSteps.includes('project') && (
                <OnboardingTooltip
                  stepId="project-create"
                  title="Create Your First Project"
                  description="Start by creating a project to organize your work and track progress."
                  position="bottom"
                />
              )}
            </div>
          )}
        </div>

        <ProjectFormDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSubmit={handleCreateProject}
        />
      </ContentSection>
    )
  }

  // Projects list
  return (
    <ContentSection>
      <PageHeader
        title="Projects"
        subtitle={`${allProjects.length} ${allProjects.length === 1 ? 'project' : 'projects'}`}
        primaryAction={
          canCreateProject() ? (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-5 h-5 mr-2" />
              New Project
            </Button>
          ) : undefined
        }
      />

      {/* Status Summary Cards */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:bg-accent/50" onClick={() => updateFilter('status', ProjectStatus.PLANNING)}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{statusCounts.planning}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Planning</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent/50" onClick={() => updateFilter('status', ProjectStatus.ACTIVE)}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Clock className="h-4 w-4 text-[var(--accent-success)]" />
              <span className="text-2xl font-bold">{statusCounts.active}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Active</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent/50" onClick={() => updateFilter('status', ProjectStatus.ON_HOLD)}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Pause className="h-4 w-4 text-[var(--accent-warning)]" />
              <span className="text-2xl font-bold">{statusCounts.onHold}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">On Hold</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent/50" onClick={() => updateFilter('status', ProjectStatus.COMPLETED)}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <CheckCircle2 className="h-4 w-4 text-[var(--accent-primary)]" />
              <span className="text-2xl font-bold">{statusCounts.completed}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Completed</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent/50" onClick={() => updateFilter('status', ProjectStatus.CANCELLED)}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <XCircle className="h-4 w-4 text-[var(--accent-danger)]" />
              <span className="text-2xl font-bold">{statusCounts.cancelled}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Cancelled</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Toolbar */}
      <div className="mt-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1" onClick={(e) => e.stopPropagation()}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            onFocus={() => filters.search && setShowSuggestions(true)}
            className="pl-9"
          />
          
          {/* Search Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-80 overflow-auto">
              {suggestions.map((project) => (
                <div
                  key={project.id}
                  className="px-4 py-3 hover:bg-accent cursor-pointer border-b border-border last:border-0"
                  onClick={() => {
                    navigate(`/app/projects/${project.id}`)
                    setShowSuggestions(false)
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{project.name}</div>
                      {project.description && (
                        <div className="text-sm text-muted-foreground truncate mt-1">
                          {project.description}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {project.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Select value={filters.status || 'all'} onValueChange={(value) => updateFilter('status', value)}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value={ProjectStatus.PLANNING}>Planning</SelectItem>
            <SelectItem value={ProjectStatus.ACTIVE}>Active</SelectItem>
            <SelectItem value={ProjectStatus.ON_HOLD}>On Hold</SelectItem>
            <SelectItem value={ProjectStatus.COMPLETED}>Completed</SelectItem>
            <SelectItem value={ProjectStatus.CANCELLED}>Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.priority || 'all'} onValueChange={(value) => updateFilter('priority', value)}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="All Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.clientId || 'all'} onValueChange={(value) => updateFilter('clientId', value)}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="All Clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map(client => (
              <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.sortBy || 'updatedAt'} onValueChange={(value) => updateFilter('sortBy', value)}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updatedAt">Recently Updated</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="deadline">Deadline</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* No results message */}
      {projects.length === 0 && allProjects.length > 0 && (
        <div className="mt-6 p-8 text-center bg-muted/30 rounded-lg border border-border">
          <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">No projects found</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters or search terms
          </p>
        </div>
      )}

      {/* Projects Grid */}
      {projects.length > 0 && (
        <div className="mt-6 grid gap-4">
          {projects.map((project) => (
          <Card 
            key={project.id}
            className="cursor-pointer rounded-xl border border-[var(--border-subtle)] shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:shadow-lg hover:border-[var(--accent-primary)] transition-all duration-200 hover:-translate-y-0.5"
            onClick={() => {
              console.log('Card clicked! Project ID:', project.id)
              navigate(`/app/projects/${project.id}`)
            }}
          >
            <CardHeader className="pb-3 px-4 pt-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base hover:text-[var(--accent-primary)] transition-colors">
                    {project.name}
                  </CardTitle>
                  {project.description && (
                    <CardDescription className="mt-1 line-clamp-2">
                      {project.description}
                    </CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <Badge variant={getStatusVariant(project.status)}>
                    {project.status}
                  </Badge>
                  <span className={`text-xs font-medium ${getPriorityColor(project.priority)}`}>
                    {project.priority}
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-4 pb-4">
              <div className="space-y-3">
                {/* Client */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  <span>{getClientName(project.clientId)}</span>
                </div>

                {/* Progress */}
                {(project.progressPercent !== undefined && project.progressPercent !== null) && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{project.progressPercent}%</span>
                    </div>
                    <Progress value={project.progressPercent} className="h-1" />
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  {(project.taskCount !== undefined && project.taskCount !== null) && (
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>
                        {project.completedTaskCount || 0}/{project.taskCount} tasks
                      </span>
                    </div>
                  )}
                  {(project.totalHours !== undefined && project.totalHours !== null) && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{project.totalHours}h logged</span>
                    </div>
                  )}
                  {project.startDate && (
                    <div className="flex items-center gap-1">
                      <span>Started: {new Date(project.startDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      )}

      <ProjectFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateProject}
      />
    </ContentSection>
  )
}
