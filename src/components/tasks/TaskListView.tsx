import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, ListTodo, Calendar, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { phaseService, type Phase } from '@/services/phaseService'
import { taskService, type Task, type CreateTaskRequest } from '@/services/taskService'
import { userService } from '@/services/userService'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import TaskFormDialog from '@/components/tasks/TaskFormDialog'
import { format } from 'date-fns'

interface TaskListViewProps {
  projectId: string
}

export function TaskListView({ projectId }: TaskListViewProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all')
  const [phaseFilter, setPhaseFilter] = useState<string>('all')

  const { data: phases = [], isLoading: phasesLoading } = useQuery({
    queryKey: ['phases', projectId],
    queryFn: () => phaseService.getPhases(projectId),
  })

  const { data: allTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => taskService.getTasks({ projectId }),
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users-for-assignment'],
    queryFn: () => userService.getUsersForAssignment(),
  })

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (data: CreateTaskRequest) => taskService.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      setIsCreateDialogOpen(false)
      toast.success('Task created successfully')
    },
    onError: (error: any) => {
      toast.error('Failed to create task', {
        description: error.response?.data?.message || 'Please try again',
      })
    },
  })

  const handleCreateTask = (data: any) => {
    createTaskMutation.mutate({
      ...data,
      projectId,
    } as CreateTaskRequest)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'bg-muted'
      case 'IN_PROGRESS':
        return 'bg-[var(--accent-primary)]'
      case 'IN_REVIEW':
        return 'bg-[var(--accent-warning)]'
      case 'DONE':
        return 'bg-[var(--accent-success)]'
      default:
        return 'bg-muted'
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'HIGH':
        return 'text-[var(--accent-danger)]'
      case 'MEDIUM':
        return 'text-[var(--accent-warning)]'
      case 'LOW':
        return 'text-[var(--accent-success)]'
      default:
        return 'text-muted-foreground'
    }
  }

  // Filter tasks based on search and filters
  const filteredTasks = allTasks.filter((task: Task) => {
    // Search filter
    const matchesSearch = searchQuery.trim() === '' || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase())

    // Status filter
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter

    // Priority filter
    const matchesPriority = priorityFilter === 'all' || 
      (priorityFilter === 'no-priority' && !task.priority) ||
      (task.priority === priorityFilter)

    // Assignee filter
    const matchesAssignee = assigneeFilter === 'all' || 
      (assigneeFilter === 'unassigned' && !task.assignedTo) ||
      (task.assignedTo === assigneeFilter)

    // Phase filter
    const matchesPhase = phaseFilter === 'all' || 
      (phaseFilter === 'no-phase' && !task.phaseId) ||
      (task.phaseId === phaseFilter)

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee && matchesPhase
  })

  // Get search suggestions
  const searchSuggestions = useMemo(() => {
    if (searchQuery.trim() === '') return []
    
    return allTasks
      .filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 5)
  }, [allTasks, searchQuery])

  const handleSuggestionClick = (task: Task) => {
    setSearchQuery(task.title)
    setShowSuggestions(false)
    navigate(`/app/projects/${projectId}/tasks/${task.id}`)
  }

  const tasksWithoutPhase = filteredTasks.filter((task: Task) => !task.phaseId)
  
  // Filter phases to only show those with matching tasks when searching
  const phasesWithTasks = useMemo(() => {
    if (searchQuery.trim() === '') {
      return phases
    }
    // Only show phases that have tasks matching the search
    return phases.filter(phase => 
      filteredTasks.some(task => task.phaseId === phase.id)
    )
  }, [phases, filteredTasks, searchQuery])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tasks</h2>
          <p className="text-muted-foreground">
            All tasks organized by phases
          </p>
        </div>
        <Button onClick={() => {
          setIsCreateDialogOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('')
                setShowSuggestions(false)
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          {/* Search Suggestions Dropdown */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md overflow-hidden max-h-80 overflow-y-auto">
              {searchSuggestions.map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleSuggestionClick(task)}
                  className="w-full px-4 py-2 text-left hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-medium truncate flex-1">{task.title}</div>
                    <Badge className={getStatusColor(task.status)} variant="secondary">
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  {task.description && (
                    <div className="text-xs text-muted-foreground truncate">
                      {task.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:flex-1">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:flex-1">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="no-priority">No Priority</SelectItem>
            </SelectContent>
          </Select>
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-full sm:flex-1">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={phaseFilter} onValueChange={setPhaseFilter}>
            <SelectTrigger className="w-full sm:flex-1">
              <SelectValue placeholder="Phase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Phases</SelectItem>
              <SelectItem value="no-phase">No Phase</SelectItem>
              {phases.map(phase => (
                <SelectItem key={phase.id} value={phase.id}>
                  {phase.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading state */}
      {(phasesLoading || tasksLoading) ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <Skeleton className="h-6 w-1/3 mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : allTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
          <ListTodo className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
          <p className="text-muted-foreground text-center max-w-md mb-4">
            Create tasks and organize them into phases for better project management
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create First Task
          </Button>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
          <ListTodo className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
          <p className="text-muted-foreground text-center max-w-md mb-4">
            Try adjusting your search or filter criteria
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tasks without phase */}
          {tasksWithoutPhase.length > 0 && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold">Unassigned Tasks</h3>
                <Badge variant="secondary">{tasksWithoutPhase.length}</Badge>
              </div>
              <div className="space-y-2">
                {tasksWithoutPhase.map((task: Task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-1 cursor-pointer" onClick={() => navigate(`/app/projects/${projectId}/tasks/${task.id}`)}>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{task.title}</h4>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                        {task.priority && (
                          <Badge variant="outline" className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {task.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                          </div>
                        )}
                      </div>
                    </div>
                    <Select
                      value={task.assignedTo || 'UNASSIGNED'}
                      onValueChange={(value) => {
                        taskService.patchTask(task.id, {
                          assignedTo: value === 'UNASSIGNED' ? undefined : value
                        }).then(() => {
                          queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
                          queryClient.invalidateQueries({ queryKey: ['task', task.id] })
                          toast.success('Assignee updated')
                        })
                      }}
                    >
                      <SelectTrigger className="w-[160px]" onClick={(e) => e.stopPropagation()}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks grouped by phase */}
          {phasesWithTasks.length > 0 && (
            <Accordion type="multiple" defaultValue={phasesWithTasks.map((p: Phase) => p.id)} className="space-y-2">
              {phasesWithTasks.map((phase: Phase) => {
                const phaseTasks = filteredTasks.filter((task: Task) => task.phaseId === phase.id)
                
                // Skip phases with no tasks when searching
                if (searchQuery.trim() !== '' && phaseTasks.length === 0) {
                  return null
                }
                
                return (
                  <AccordionItem
                    key={phase.id}
                    value={phase.id}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 flex-1">
                        <h3 className="text-lg font-semibold">{phase.name}</h3>
                        <Badge variant="secondary">{phaseTasks.length}</Badge>
                        <Badge className="text-xs">{phase.status}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {phaseTasks.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p className="mb-3">No tasks in this phase yet</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setIsCreateDialogOpen(true)
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Task
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2 pb-4">
                          {phaseTasks.map((task: Task) => (
                            <div
                              key={task.id}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                            >
                              <div className="flex-1 cursor-pointer" onClick={() => navigate(`/app/projects/${projectId}/tasks/${task.id}`)}>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium">{task.title}</h4>
                                  <Badge className={getStatusColor(task.status)}>
                                    {task.status.replace('_', ' ')}
                                  </Badge>
                                  {task.priority && (
                                    <Badge variant="outline" className={getPriorityColor(task.priority)}>
                                      {task.priority}
                                    </Badge>
                                  )}
                                </div>
                                {task.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-1">
                                    {task.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  {task.dueDate && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Select
                                value={task.assignedTo || 'UNASSIGNED'}
                                onValueChange={(value) => {
                                  taskService.patchTask(task.id, {
                                    assignedTo: value === 'UNASSIGNED' ? undefined : value
                                  }).then(() => {
                                    queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
                                    queryClient.invalidateQueries({ queryKey: ['task', task.id] })
                                    toast.success('Assignee updated')
                                  })
                                }}
                              >
                                <SelectTrigger className="w-[160px]" onClick={(e) => e.stopPropagation()}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                                  {users.map(user => (
                                    <SelectItem key={user.id} value={user.id}>
                                      {user.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ))}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          )}
        </div>
      )}

      {/* Create dialog */}
      <TaskFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        projectId={projectId}
        onSubmit={handleCreateTask}
        isSubmitting={createTaskMutation.isPending}
      />
    </div>
  )
}
