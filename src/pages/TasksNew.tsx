import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2, Filter, List, LayoutGrid, Users, UserCircle, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { taskService, type CreateTaskRequest, type TaskStatus, type Task } from '@/services/taskService'
import { projectService } from '@/services/projectService'
import { teamService } from '@/services/teamService'
import { phaseService } from '@/services/phaseService'
import { userService } from '@/services/userService'
import Kanban, { type KanbanTask } from '@/components/kanban/Kanban'
import PageHeader from '@/components/common/PageHeader'
import ContentSection from '@/components/common/ContentSection'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useUserRole } from '@/hooks/useUserRole'
import { useNavigate } from 'react-router-dom'

// Map backend status to Kanban status
const statusMap: Record<string, 'todo' | 'in_progress' | 'blocked' | 'review' | 'done'> = {
  'TODO': 'todo',
  'IN_PROGRESS': 'in_progress',
  'BLOCKED': 'blocked',
  'REVIEW': 'review',
  'DONE': 'done',
}

const reverseStatusMap: Record<'todo' | 'in_progress' | 'blocked' | 'review' | 'done', TaskStatus> = {
  'todo': 'TODO',
  'in_progress': 'IN_PROGRESS',
  'blocked': 'BLOCKED',
  'review': 'REVIEW',
  'done': 'DONE',
}

const priorityMap: Record<string, 'low' | 'medium' | 'high' | 'urgent'> = {
  'LOW': 'low',
  'MEDIUM': 'medium',
  'HIGH': 'high',
  'URGENT': 'urgent',
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  'TODO': 'bg-muted text-muted-foreground',
  'IN_PROGRESS': 'bg-[var(--accent-primary-weak)] text-[var(--accent-primary)]',
  'BLOCKED': 'bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]',
  'REVIEW': 'bg-[var(--accent-warning)]/10 text-[var(--accent-warning)]',
  'DONE': 'bg-[var(--accent-success)]/10 text-[var(--accent-success)]',
}

const PRIORITY_COLORS: Record<string, string> = {
  'LOW': 'bg-muted text-muted-foreground',
  'MEDIUM': 'bg-[var(--accent-primary-weak)] text-[var(--accent-primary)]',
  'HIGH': 'bg-[var(--accent-warning)]/10 text-[var(--accent-warning)]',
  'URGENT': 'bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]',
}

type ViewMode = 'kanban' | 'list'
type GroupBy = 'none' | 'team' | 'assignee' | 'project'

export default function TasksNew() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user, isTopUser, isSuperUser, isAdmin, isUser, teamId } = useUserRole()
  
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [groupBy, setGroupBy] = useState<GroupBy>('none')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedStatuses, setSelectedStatuses] = useState<TaskStatus[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [selectedAssignee, setSelectedAssignee] = useState<string>('')
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [selectedTeamMember, setSelectedTeamMember] = useState<string>('')
  
  const [formData, setFormData] = useState<CreateTaskRequest>({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    projectId: '',
  })

  // Fetch projects
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
  })

  // Fetch teams (for all users to select teams for tasks)
  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamService.getTeams(),
  })

  // Fetch all users (to get team members for the filter)
  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
  })

  // Fetch phases for selected project in create dialog
  const { data: phases } = useQuery({
    queryKey: ['phases', formData.projectId],
    queryFn: () => phaseService.getPhases(formData.projectId),
    enabled: !!formData.projectId,
  })

  // Build task filters based on user role
  const taskFilters = useMemo(() => {
    const filters: any = {}
    
    console.log('🔍 Building task filters...')
    console.log('User info:', { isUser, isAdmin, isTopUser, isSuperUser, teamId })
    console.log('Selected filters:', { selectedTeam, selectedAssignee, selectedProject, selectedStatuses, selectedTeamMember })
    
    // Apply role-based default filters
    if (isUser || isAdmin) {
      // Regular users and admins MUST see only their team's tasks
      if (teamId) {
        filters.teamId = teamId
        console.log('✅ Applied teamId filter for USER/ADMIN:', teamId)
      } else {
        console.warn('⚠️ USER/ADMIN has NO teamId!')
      }
    }
    
    // Apply user-selected filters (but NOT team filter for USER/ADMIN - they can't change teams)
    // Only TOP_USER and SUPER_USER can filter by team
    if ((isTopUser || isSuperUser) && selectedTeam) {
      filters.teamId = selectedTeam
      console.log('✅ Applied teamId filter for TOP_USER/SUPER_USER:', selectedTeam)
    }
    
    if (selectedAssignee) filters.assignedTo = selectedAssignee
    if (selectedProject) filters.projectId = selectedProject
    if (selectedStatuses.length > 0) filters.status = selectedStatuses[0] // API may not support multiple
    
    // For ADMIN/USER: apply team member filter (within their team only)
    if ((isAdmin || isUser) && selectedTeamMember) {
      filters.assignedTo = selectedTeamMember
      console.log('✅ Applied assignedTo filter for team member:', selectedTeamMember)
    }
    
    console.log('📤 Final filters being sent to API:', filters)
    
    return filters
  }, [isUser, isAdmin, isTopUser, isSuperUser, teamId, selectedTeam, selectedAssignee, selectedProject, selectedStatuses, selectedTeamMember])

  // Fetch tasks with role-based filtering
  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['tasks', taskFilters],
    queryFn: () => taskService.getTasks(taskFilters),
  })

  // Create task mutation
  const createMutation = useMutation({
    mutationFn: taskService.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setIsCreateDialogOpen(false)
      setFormData({ title: '', description: '', status: 'TODO', priority: 'MEDIUM', projectId: '' })
      toast.success('Task created successfully')
    },
    onError: (error: any) => {
      toast.error('Failed to create task', {
        description: error.response?.data?.message || 'Please try again',
      })
    },
  })

  // Update task status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      taskService.updateTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task status updated')
    },
    onError: (error: any) => {
      toast.error('Failed to update task', {
        description: error.response?.data?.message || 'Please try again',
      })
    },
  })

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title) {
      toast.error('Title is required')
      return
    }
    if (!formData.projectId) {
      toast.error('Project is required')
      return
    }
    createMutation.mutate(formData)
  }

  const handleTaskMove = (taskId: string, newStatus: 'todo' | 'in_progress' | 'blocked' | 'review' | 'done') => {
    const backendStatus = reverseStatusMap[newStatus]
    updateStatusMutation.mutate({ id: taskId, status: backendStatus })
  }

  const handleTaskClick = (taskId: string) => {
    navigate(`/app/tasks/${taskId}`)
  }

  // Filter tasks based on selected filters
  const filteredTasks = useMemo(() => {
    if (!tasks) return []
    let filtered = [...tasks]
    
    // Status filter
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(task => selectedStatuses.includes(task.status))
    }
    
    return filtered
  }, [tasks, selectedStatuses])

  // Group tasks
  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') return { 'All Tasks': filteredTasks }
    
    const groups: Record<string, Task[]> = {}
    
    filteredTasks.forEach(task => {
      let key = 'Unassigned'
      
      switch (groupBy) {
        case 'team':
          if (task.teamId) {
            const teamName = teams?.find(t => t.id === task.teamId)?.name
            key = teamName || 'Unknown Team'
          } else {
            key = 'No Team Assigned'
          }
          break
        case 'assignee':
          if (task.assignedTo) {
            // Try to get name from task data first, fallback to users list
            if (task.assigneeName) {
              key = task.assigneeName
            } else {
              const assigneeUser = allUsers?.find(u => u.id === task.assignedTo)
              key = assigneeUser?.name || 'Unknown User'
            }
          } else {
            key = 'Unassigned'
          }
          break
        case 'project':
          if (task.projectId) {
            // Try to get name from task data first, fallback to projects list
            if (task.projectName) {
              key = task.projectName
            } else {
              const project = projects?.find(p => p.id === task.projectId)
              key = project?.name || 'Unknown Project'
            }
          } else {
            key = 'No Project'
          }
          break
      }
      
      if (!groups[key]) groups[key] = []
      groups[key].push(task)
    })
    
    return groups
  }, [filteredTasks, groupBy, teams, allUsers, projects])

  // Transform tasks to Kanban format
  const kanbanTasks: KanbanTask[] = filteredTasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description || '',
    status: statusMap[task.status] || 'todo',
    priority: task.priority ? priorityMap[task.priority] : undefined,
    dueDate: task.dueDate || undefined,
    assignee: task.assigneeName || undefined,
  }))

  // Get unique users for assignee filter
  const uniqueAssignees = useMemo(() => {
    if (!tasks) return []
    const assignees = new Map<string, { id: string; name: string }>()
    tasks.forEach(task => {
      if (task.assignedTo && task.assigneeName) {
        assignees.set(task.assignedTo, { id: task.assignedTo, name: task.assigneeName })
      }
    })
    return Array.from(assignees.values())
  }, [tasks])

  // Get team members for ADMIN/USER roles (from their team)
  const teamMembers = useMemo(() => {
    if (!(isAdmin || isUser) || !teamId || !allUsers) return []
    // Filter users who belong to the same team
    return allUsers
      .filter(user => user.teamId === teamId && user.isActive !== false)
      .map(user => ({ id: user.id, name: user.name, email: user.email }))
  }, [isAdmin, isUser, teamId, allUsers])

  const clearFilters = () => {
    setSelectedStatuses([])
    setSelectedTeam('')
    setSelectedAssignee('')
    setSelectedProject('')
    setSelectedTeamMember('')
  }

  const activeFilterCount = [
    selectedStatuses.length > 0,
    selectedTeam !== '',
    selectedAssignee !== '',
    selectedProject !== '',
    selectedTeamMember !== '',
  ].filter(Boolean).length

  if (isLoading) {
    return (
      <div className="p-4">
        <PageHeader title="Tasks" subtitle="Manage your tasks and workflow" />
        <ContentSection>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Loading tasks...</p>
            </div>
          </div>
        </ContentSection>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <PageHeader title="Tasks" subtitle="Manage your tasks and workflow" />
        <ContentSection>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-3">
              <p className="text-sm text-destructive">Failed to load tasks</p>
              <p className="text-xs text-muted-foreground">
                {(error as any)?.response?.data?.message || 'Please try again later'}
              </p>
            </div>
          </div>
        </ContentSection>
      </div>
    )
  }

  return (
    <div className="p-4">
      <PageHeader
        title="Tasks"
        subtitle={
          isTopUser
            ? 'All tasks across the organization'
            : isSuperUser
            ? 'Tasks from your teams'
            : isAdmin
            ? 'Tasks from your team'
            : 'Your assigned tasks'
        }
        primaryAction={
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        }
      />

      <ContentSection>
        {/* Filters and Controls */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Board
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4 mr-2" />
              List
            </Button>
          </div>

          {/* Group By */}
          {(isTopUser || isSuperUser) && (
            <Select value={groupBy} onValueChange={(value) => {
              setGroupBy(value as GroupBy)
              // Auto-switch to list view when grouping
              if (value !== 'none') {
                setViewMode('list')
              }
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Group by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Grouping</SelectItem>
                <SelectItem value="team">By Team</SelectItem>
                <SelectItem value="assignee">By Assignee</SelectItem>
                <SelectItem value="project">By Project</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Team Member Filter - for ADMIN and USER */}
          {(isAdmin || isUser) && teamMembers.length > 0 && (
            <Select 
              value={selectedTeamMember || 'all'} 
              onValueChange={(value) => setSelectedTeamMember(value === 'all' ? '' : value)}
            >
              <SelectTrigger className="w-[200px]">
                <UserCircle className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Team Members" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Team Members</SelectItem>
                {teamMembers.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Filters Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
                <ChevronDown className="w-3 h-3 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Filter Tasks</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Status Filter */}
              <div className="px-2 py-2">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div className="mt-2 space-y-1">
                  {(['TODO', 'IN_PROGRESS', 'BLOCKED', 'REVIEW', 'DONE'] as TaskStatus[]).map(status => (
                    <DropdownMenuCheckboxItem
                      key={status}
                      checked={selectedStatuses.includes(status)}
                      onCheckedChange={(checked) => {
                        setSelectedStatuses(prev =>
                          checked ? [...prev, status] : prev.filter(s => s !== status)
                        )
                      }}
                    >
                      {status.replace('_', ' ')}
                    </DropdownMenuCheckboxItem>
                  ))}
                </div>
              </div>

              <DropdownMenuSeparator />

              {/* Team Filter - for TOP_USER and SUPER_USER */}
              {(isTopUser || isSuperUser) && teams && teams.length > 0 && (
                <>
                  <div className="px-2 py-2">
                    <Label className="text-xs text-muted-foreground">Team</Label>
                    <Select value={selectedTeam || undefined} onValueChange={(value) => setSelectedTeam(value || '')}>
                      <SelectTrigger className="w-full mt-2">
                        <SelectValue placeholder="All Teams" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map(team => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DropdownMenuSeparator />
                </>
              )}

              {/* Assignee Filter */}
              {uniqueAssignees.length > 0 && (
                <>
                  <div className="px-2 py-2">
                    <Label className="text-xs text-muted-foreground">Assignee</Label>
                    <Select value={selectedAssignee || undefined} onValueChange={(value) => setSelectedAssignee(value || '')}>
                      <SelectTrigger className="w-full mt-2">
                        <SelectValue placeholder="All Assignees" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueAssignees.map(assignee => (
                          <SelectItem key={assignee.id} value={assignee.id}>
                            {assignee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DropdownMenuSeparator />
                </>
              )}

              {/* Project Filter */}
              {projects && projects.length > 0 && (
                <div className="px-2 py-2">
                  <Label className="text-xs text-muted-foreground">Project</Label>
                  <Select value={selectedProject || undefined} onValueChange={(value) => setSelectedProject(value || '')}>
                    <SelectTrigger className="w-full mt-2">
                      <SelectValue placeholder="All Projects" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {activeFilterCount > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={clearFilters}
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="ml-auto text-sm text-muted-foreground">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
          </div>
        </div>

        {/* Task Display */}
        {filteredTasks.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4 max-w-md">
              <div className="w-16 h-16 rounded-full bg-[var(--accent-primary-weak)] flex items-center justify-center mx-auto">
                <Plus className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">
                  {activeFilterCount > 0 ? 'No tasks match your filters' : 'No tasks yet'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {activeFilterCount > 0
                    ? 'Try adjusting your filters or create a new task'
                    : 'Create your first task to get started with your workflow'}
                </p>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </Button>
            </div>
          </div>
        ) : viewMode === 'kanban' && groupBy === 'none' ? (
          <Kanban
            tasks={kanbanTasks}
            onTaskMove={handleTaskMove}
            onTaskClick={handleTaskClick}
            userRole={user?.role || 'USER'}
            currentUserId={user?.id}
          />
        ) : (
          /* List View */
          groupBy === 'none' ? (
            <div className="space-y-3">
              {filteredTasks.map(task => (
                <Card
                  key={task.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleTaskClick(task.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold truncate">{task.title}</h4>
                          <Badge className={STATUS_COLORS[task.status]}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className={PRIORITY_COLORS[task.priority]}>
                            {task.priority}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {task.projectName && (
                            <span>📁 {task.projectName}</span>
                          )}
                          {task.assigneeName && (
                            <span>👤 {task.assigneeName}</span>
                          )}
                          {task.dueDate && (
                            <span>📅 {new Date(task.dueDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* Grouped List View */
            <div className="space-y-8">
              {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
                <div key={groupName}>
                  <div className="flex items-center gap-3 mb-4 pb-2 border-b">
                    {groupBy === 'team' && <Users className="w-5 h-5 text-primary" />}
                    {groupBy === 'assignee' && <UserCircle className="w-5 h-5 text-primary" />}
                    <h3 className="text-lg font-semibold">{groupName}</h3>
                    <Badge variant="secondary" className="ml-auto">
                      {groupTasks.length} {groupTasks.length === 1 ? 'task' : 'tasks'}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {groupTasks.map(task => (
                      <Card
                        key={task.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleTaskClick(task.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold truncate">{task.title}</h4>
                                <Badge className={STATUS_COLORS[task.status]}>
                                  {task.status.replace('_', ' ')}
                                </Badge>
                                <Badge variant="outline" className={PRIORITY_COLORS[task.priority]}>
                                  {task.priority}
                                </Badge>
                              </div>
                              {task.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                  {task.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                {task.projectName && (
                                  <span>📁 {task.projectName}</span>
                                )}
                                {task.assigneeName && groupBy !== 'assignee' && (
                                  <span>👤 {task.assigneeName}</span>
                                )}
                                {task.dueDate && (
                                  <span>📅 {new Date(task.dueDate).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </ContentSection>

      {/* Create Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to your workflow. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTask}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter task title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter task description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project">Project *</Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, projectId: value })
                  }
                >
                  <SelectTrigger id="project">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phase">Phase (Optional)</Label>
                <Select
                  value={formData.phaseId || undefined}
                  onValueChange={(value) => {
                    const selectedPhase = phases?.find(p => p.id === value)
                    setFormData({ 
                      ...formData, 
                      phaseId: value || undefined,
                      // Auto-assign team from phase if available
                      teamId: selectedPhase?.teamId || formData.teamId
                    })
                  }}
                  disabled={!formData.projectId}
                >
                  <SelectTrigger id="phase">
                    <SelectValue placeholder={formData.projectId ? "Select phase (optional)" : "Select project first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {phases?.map((phase) => (
                      <SelectItem key={phase.id} value={phase.id}>
                        {phase.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Show team selector only if phase is NOT selected */}
              {!formData.phaseId && (
                <div className="space-y-2">
                  <Label htmlFor="team">Team (Optional)</Label>
                  <Select
                    value={formData.teamId || undefined}
                    onValueChange={(value) =>
                      setFormData({ ...formData, teamId: value || undefined })
                    }
                  >
                    <SelectTrigger id="team">
                      <SelectValue placeholder="Select team (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams?.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {/* Show message when team is auto-assigned from phase */}
              {formData.phaseId && phases?.find(p => p.id === formData.phaseId)?.teamId && (
                <div className="space-y-2">
                  <Label htmlFor="team-info">Team</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground">
                      Team auto-assigned from phase: <span className="font-medium text-foreground">{teams?.find(t => t.id === phases?.find(p => p.id === formData.phaseId)?.teamId)?.name || 'Unknown'}</span>
                    </p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value as TaskStatus })
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODO">To Do</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="BLOCKED">Blocked</SelectItem>
                      <SelectItem value="REVIEW">Review</SelectItem>
                      <SelectItem value="DONE">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      setFormData({ ...formData, priority: value as any })
                    }
                  >
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Task'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
