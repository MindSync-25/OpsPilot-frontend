import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useOnboarding } from '@/contexts/OnboardingContext'
import OnboardingTooltip from '@/components/onboarding/OnboardingTooltip'
import { taskService, type CreateTaskRequest, type TaskStatus } from '@/services/taskService'
import { projectService } from '@/services/projectService'
import Kanban, { type KanbanTask } from '@/components/kanban/Kanban'
import PageHeader from '@/components/common/PageHeader'
import ContentSection from '@/components/common/ContentSection'
import { Button } from '@/components/ui/button'
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

export default function Tasks() {
  const queryClient = useQueryClient()
  const { shouldShowOnboarding, completedSteps } = useOnboarding()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [formData, setFormData] = useState<CreateTaskRequest>({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    projectId: '', // Will be set when dialog opens
  })

  // Fetch projects for dropdown
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
  })

  // Fetch tasks
  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => taskService.getTasks(),
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
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData(['tasks'])

      // Optimistically update
      queryClient.setQueryData(['tasks'], (old: any) =>
        old?.map((task: any) => (task.id === id ? { ...task, status } : task))
      )

      return { previousTasks }
    },
    onError: (error: any, _variables, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks)
      }
      toast.error('Failed to update task', {
        description: error.response?.data?.message || 'Please try again',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
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

  // Transform backend tasks to Kanban tasks
  const kanbanTasks: KanbanTask[] = tasks?.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description || '',
    status: statusMap[task.status] || 'todo',
    priority: task.priority ? priorityMap[task.priority] : undefined,
    dueDate: task.dueDate || undefined,
  })) || []

  if (isLoading) {
    return (
      <div className="p-4">
        <PageHeader
          title="Tasks"
          subtitle="Manage your tasks and workflow"
        />
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
        <PageHeader
          title="Tasks"
          subtitle="Manage your tasks and workflow"
        />
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
        subtitle="Manage your tasks and workflow"
        primaryAction={
          <div className="relative">
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
            {shouldShowOnboarding && !completedSteps.includes('task') && (
              <OnboardingTooltip
                stepId="task-create"
                title="Create Your First Task"
                description="Break down your projects into manageable tasks. Assign team members and track progress."
                position="bottom"
              />
            )}
          </div>
        }
      />

      <ContentSection>
        {kanbanTasks.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4 max-w-md">
              <div className="w-16 h-16 rounded-full bg-[var(--accent-primary-weak)] flex items-center justify-center mx-auto">
                <Plus className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">No tasks yet</h3>
                <p className="text-sm text-muted-foreground">
                  Create your first task to get started with your workflow
                </p>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </Button>
            </div>
          </div>
        ) : (
          <Kanban 
            tasks={kanbanTasks} 
            onTaskMove={handleTaskMove}
            userRole="ADMIN"
            currentUserId={undefined}
          />
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
