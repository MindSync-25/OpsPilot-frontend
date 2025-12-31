import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Loader2, 
  Briefcase,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'
import { projectService, type CreateProjectRequest } from '@/services/projectService'
// import { taskService } from '@/services/taskService'
import { clientService } from '@/services/clientService'
// import { userService } from '@/services/userService'
// import { useAuthStore } from '@/app/store'
import { useUserRole } from '@/hooks/useUserRole'
import { InvoiceTable } from '@/components/invoices/InvoiceTable'
import PageHeader from '@/components/common/PageHeader'
import ContentSection from '@/components/common/ContentSection'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import ProjectFormDialog from '@/components/projects/ProjectFormDialog'
import { PhaseListView } from '@/components/phases/PhaseListView'
import { TaskListView } from '@/components/tasks/TaskListView'
import { ProjectTeamView } from '@/components/projects/ProjectTeamView'
import { ProjectTimeView } from '@/components/projects/ProjectTimeView'

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  // const user = useAuthStore((state) => state.user)
  const { canEditProject, canDeleteProject, isAdmin, isUser } = useUserRole()

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  // ADMIN and USER roles start on tasks tab, others start on overview
  const [activeTab, setActiveTab] = useState((isAdmin || isUser) ? 'tasks' : 'overview')
  
  // Auto-redirect ADMIN and USER to tasks tab on mount
  useEffect(() => {
    if (isAdmin || isUser) {
      setActiveTab('tasks')
    }
  }, [isAdmin, isUser])

  // Fetch project
  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getProject(id!),
    enabled: !!id,
  })

  // Fetch client
  const { data: client } = useQuery({
    queryKey: ['client', project?.clientId],
    queryFn: () => clientService.getClient(project!.clientId),
    enabled: !!project?.clientId,
  })

  // TODO: Re-enable when backend endpoint is fixed
  // const { data: members = [] } = useQuery({
  //   queryKey: ['projectMembers', id],
  //   queryFn: () => projectService.getProjectMembers(id!),
  //   enabled: !!id,
  // })
  const members: any[] = []

  // Fetch tasks for this project
  /*
  const { data: allTasks = [] } = useQuery({
    queryKey: ['tasks', id],
    queryFn: async () => {
      console.log('Fetching tasks for project:', id)
      const tasks = await taskService.getTasks(id!)
      console.log('Fetched tasks:', tasks)
      return tasks
    },
    enabled: !!id,
  })
  */

  // Fetch users for task assignment
  /*
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsersForAssignment(),
  })
  */

  // Filter tasks based on user role
  /*
  const tasks = useMemo(() => {
    console.log('Filtering tasks. User:', user, 'All tasks:', allTasks)
    if (!user) return []
    
    // TOP_USER, SUPER_USER, ADMIN can see all tasks
    if (['TOP_USER', 'SUPER_USER', 'ADMIN'].includes(user.role)) {
      console.log('User is admin, returning all tasks:', allTasks)
      return allTasks
    }
    
    // USER can only see tasks assigned to them
    if (user.role === 'USER') {
      const userTasks = allTasks.filter(task => task.assignedTo === user.id)
      console.log('User is USER, returning assigned tasks:', userTasks)
      return userTasks
    }
    
    // CLIENT gets read-only or no access (showing empty for now)
    if (user.role === 'CLIENT') {
      console.log('User is CLIENT, returning empty')
      return []
    }
    
    return allTasks
  }, [allTasks, user])
  */

  // Map tasks to Kanban format
  /*
  const _kanbanTasks = useMemo(() => {
    console.log('Mapping tasks to Kanban format:', tasks)
    const mapped = tasks.map(task => {
      const assignee = users.find(u => u.id === task.assignedTo)
      return {
        id: task.id,
        title: task.title,
        description: task.description || '',
        status: task.status.toLowerCase() as 'todo' | 'in_progress' | 'done',
        priority: task.priority?.toLowerCase() as 'low' | 'medium' | 'high' | undefined,
        assignee: assignee?.name,
        assigneeUserId: task.assignedTo,
        dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : undefined,
      }
    })
    console.log('Kanban tasks:', mapped)
    return mapped
  }, [tasks, users])
  */

  // Check if user can create/edit tasks
  /*
  const _canManageTasks = useMemo(() => {
    if (!user) return false
    return ['TOP_USER', 'SUPER_USER', 'ADMIN'].includes(user.role)
  }, [user])
  */

  // Check if user can update task status
  /*
  const canUpdateTaskStatus = useMemo(() => {
    if (!user) return false
    if (['TOP_USER', 'SUPER_USER', 'ADMIN'].includes(user.role)) return true
    // USER can update status of their own tasks
    return user.role === 'USER'
  }, [user])
  */

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: CreateProjectRequest) => projectService.updateProject(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setIsEditDialogOpen(false)
      toast.success('Project updated successfully')
    },
    onError: (error: Error) => {
      toast.error('Failed to update project', {
        description: (error as { response?: { data?: { message?: string } } }).response?.data?.message || error.message,
      })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => projectService.deleteProject(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project deleted successfully')
      navigate('/app/projects')
    },
    onError: (error: Error) => {
      toast.error('Failed to delete project', {
        description: (error as { response?: { data?: { message?: string } } }).response?.data?.message || error.message,
      })
    },
  })

  const handleUpdateProject = (data: CreateProjectRequest) => {
    updateMutation.mutate(data)
  }

  // Create task mutation
  /*
  const createTaskMutation = useMutation({
    mutationFn: async (data: CreateTaskRequest) => {
      console.log('Creating task with data:', data)
      const result = await taskService.createTask(data)
      console.log('Task created:', result)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] })
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      toast.success('Task created successfully')
    },
    onError: (error: Error) => {
      console.error('Task creation error:', error)
      toast.error('Failed to create task', {
        description: (error as { response?: { data?: { message?: string } } }).response?.data?.message || error.message,
      })
    },
  })
  */

  // Update task status mutation
  /*
  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      taskService.updateTaskStatus(taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] })
      queryClient.invalidateQueries({ queryKey: ['project', id] })
    },
    onError: (error: Error) => {
      toast.error('Failed to update task status', {
        description: (error as { response?: { data?: { message?: string } } }).response?.data?.message || error.message,
      })
      // Refetch to revert optimistic update
      queryClient.invalidateQueries({ queryKey: ['tasks', id] })
    },
  })
  */

  /*
  const _handleCreateTask = (data: Record<string, unknown>) => {
    createTaskMutation.mutate({
      ...(data as Omit<CreateTaskRequest, 'projectId'>),
      projectId: id!,
    } as CreateTaskRequest)
  }
  */

  /*
  const _handleTaskMove = (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => {
    const task = allTasks.find(t => t.id === taskId)
    if (!task) return

    // Check permissions
    if (!canUpdateTaskStatus) {
      toast.error('You do not have permission to update task status')
      return
    }

    // USER can only update their own tasks
    if (user?.role === 'USER' && task.assignedTo !== user.id) {
      toast.error('You can only update your own tasks')
      return
    }

    // Convert status to backend format
    const statusMap = {
      'todo': 'TODO' as TaskStatus,
      'in_progress': 'IN_PROGRESS' as TaskStatus,
      'done': 'DONE' as TaskStatus,
    }

    // Optimistic update
    queryClient.setQueryData(['tasks', id], (old: typeof allTasks = []) =>
      old.map(t => t.id === taskId ? { ...t, status: statusMap[newStatus] } : t)
    )

    updateTaskStatusMutation.mutate({
      taskId,
      status: statusMap[newStatus],
    })
  }
  */

  const handleDeleteProject = () => {
    deleteMutation.mutate()
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'default'
      case 'COMPLETED': return 'secondary'
      case 'ON_HOLD': return 'outline'
      case 'CANCELLED': return 'destructive'
      default: return 'outline'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600 dark:text-red-400'
      case 'MEDIUM': return 'text-yellow-600 dark:text-yellow-400'
      case 'LOW': return 'text-green-600 dark:text-green-400'
      default: return 'text-muted-foreground'
    }
  }

  if (isLoading) {
    return (
      <ContentSection>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </ContentSection>
    )
  }

  if (!project) {
    return (
      <ContentSection>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Project not found</p>
          <Button onClick={() => navigate('/app/projects')} className="mt-4">
            Back to Projects
          </Button>
        </div>
      </ContentSection>
    )
  }

  // For ADMIN and USER: Show simplified view with only phase/task tabs
  if (isAdmin || isUser) {
    return (
      <ContentSection>
        {/* Nested tabs for Phases and Tasks - No header, no project info */}
        <Tabs defaultValue="phases" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="phases">Phases</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>
          
          <TabsContent value="phases" className="mt-6">
            <PhaseListView projectId={id!} />
          </TabsContent>
          
          <TabsContent value="tasks" className="mt-6">
            <TaskListView projectId={id!} />
          </TabsContent>
        </Tabs>
      </ContentSection>
    )
  }

  // For TOP_USER, SUPER_USER, CLIENT: Show full project details view
  return (
    <ContentSection>
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/app/projects')}
          className="-ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
      </div>
      
      <PageHeader
        title={project.name}
        subtitle={project.description || undefined}
        primaryAction={
          <div className="flex items-center gap-2">
            {canEditProject() && (
              <Button onClick={() => setIsEditDialogOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {canDeleteProject() && (
              <Button
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
          <div className="flex items-center gap-4">
            <Badge variant={getStatusVariant(project.status)}>
              {project.status}
            </Badge>
            <span className={`text-sm font-medium ${getPriorityColor(project.priority)}`}>
              {project.priority} Priority
            </span>
            {client && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                <span>{client.name}</span>
              </div>
            )}
          </div>
          
          <TabsList>
            {/* ADMIN and USER only see Tasks tab, others see all tabs */}
            {!isAdmin && !isUser && <TabsTrigger value="overview">Overview</TabsTrigger>}
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            {!isUser && <TabsTrigger value="team">Team</TabsTrigger>}
            {!isUser && <TabsTrigger value="time">Time Tracking</TabsTrigger>}
            {!isUser && <TabsTrigger value="invoices">Invoices</TabsTrigger>}
          </TabsList>
        </div>

        {/* Overview Tab - Hidden for ADMIN and USER */}
        {!isAdmin && !isUser && (
          <TabsContent value="overview" className="space-y-6">{/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{project.taskCount || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {project.completedTaskCount || 0} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{project.progressPercent || 0}%</div>
                <Progress value={project.progressPercent || 0} className="mt-2 h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Time Logged
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{project.totalHours || 0}h</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {project.billableHours || 0}h billable
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Team Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{members.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Active members</p>
              </CardContent>
            </Card>
          </div>

          {/* Project Details */}
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {project.startDate && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Start Date
                    </p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(project.startDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
                {project.endDate && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      End Date
                    </p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(project.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Created
                  </p>
                  <span className="text-sm">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Last Updated
                  </p>
                  <span className="text-sm">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        )}

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          {/* Nested tabs for Phases and Tasks */}
          <Tabs defaultValue="phases" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="phases">Phases</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
            </TabsList>
            
            <TabsContent value="phases" className="mt-6">
              <PhaseListView projectId={id!} />
            </TabsContent>
            
            <TabsContent value="tasks" className="mt-6">
              <TaskListView projectId={id!} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Team Tab - Hidden for USER */}
        {!isUser && (
          <TabsContent value="team">
            <ProjectTeamView projectId={id!} />
          </TabsContent>
        )}

        {/* Time Tracking Tab - Hidden for USER */}
        {!isUser && (
          <TabsContent value="time">
            <ProjectTimeView projectId={id!} />
          </TabsContent>
        )}

        {/* Invoices Tab - Hidden for USER */}
        {!isUser && (
          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>
                  Invoices related to this project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InvoiceTable 
                  projectId={project.id} 
                  hideProjectColumn={true}
                  showCreateButton={!isUser}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Edit Dialog */}
      <ProjectFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        project={project}
        onSubmit={handleUpdateProject}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project "{project.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ContentSection>
  )
}
