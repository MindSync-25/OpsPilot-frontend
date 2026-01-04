import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Calendar, User, Pencil, Trash2, Plus, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { taskService } from '@/services/taskService'
import { subtaskService, type Subtask } from '@/services/subtaskService'
import { userService } from '@/services/userService'
import { teamService } from '@/services/teamService'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CommentSection } from '@/components/common/CommentSection'
import { AttachmentSection } from '@/components/common/AttachmentSection'
import { SubtaskFormDialog } from '@/components/tasks/SubtaskFormDialog'
import TaskFormDialog from '@/components/tasks/TaskFormDialog'
import { format } from 'date-fns'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TaskDetailPage() {
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isCreateSubtaskOpen, setIsCreateSubtaskOpen] = useState(false)
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [descriptionText, setDescriptionText] = useState('')
  const queryClient = useQueryClient()

  // Determine if we came from the tasks module or a project
  const cameFromTasksModule = location.pathname.startsWith('/app/tasks/')
  
  // Helper function for back navigation
  const handleBackNavigation = () => {
    if (cameFromTasksModule) {
      navigate('/app/tasks')
    } else if (projectId) {
      navigate(`/app/projects/${projectId}`)
    } else if (task?.projectId) {
      navigate(`/app/projects/${task.projectId}`)
    } else {
      navigate('/app/tasks')
    }
  }
  
  const getBackButtonText = () => {
    return cameFromTasksModule ? 'Back to Tasks' : 'Back to Project'
  }

  // Fetch task details
  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => taskService.getTask(taskId!),
    enabled: !!taskId,
  })

  // Fetch subtasks
  const { data: subtasks = [], isLoading: subtasksLoading } = useQuery({
    queryKey: ['subtasks', taskId],
    queryFn: () => subtaskService.getSubtasks(taskId!),
    enabled: !!taskId,
  })

  // Fetch users for assignee lookup
  const { data: users = [] } = useQuery({
    queryKey: ['users-for-assignment'],
    queryFn: () => userService.getUsersForAssignment(),
  })

  // Fetch teams for team name lookup
  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamService.getTeams(),
  })

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: () => taskService.deleteTask(taskId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task deleted successfully')
      handleBackNavigation()
    },
    onError: () => {
      toast.error('Failed to delete task')
    },
  })

  // Toggle subtask status
  const toggleSubtaskMutation = useMutation({
    mutationFn: ({ subtaskId, newStatus }: { subtaskId: string; newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE' }) =>
      subtaskService.updateSubtask(taskId!, subtaskId, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] })
    },
  })

  // Delete subtask mutation
  const deleteSubtaskMutation = useMutation({
    mutationFn: (subtaskId: string) => subtaskService.deleteSubtask(taskId!, subtaskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] })
      toast.success('Subtask deleted successfully')
    },
  })

  // Update task assignee mutation
  const updateAssigneeMutation = useMutation({
    mutationFn: (assignedTo: string | undefined) =>
      taskService.patchTask(taskId!, { assignedTo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] })
      if (task?.projectId) {
        queryClient.invalidateQueries({ queryKey: ['tasks', task.projectId] })
      }
      toast.success('Assignee updated successfully')
    },
  })

  // Update description mutation
  const updateDescriptionMutation = useMutation({
    mutationFn: (description: string) =>
      taskService.patchTask(taskId!, { description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] })
      if (task?.projectId) {
        queryClient.invalidateQueries({ queryKey: ['tasks', task.projectId] })
      }
      setIsEditingDescription(false)
      toast.success('Description updated successfully')
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE':
        return 'bg-[var(--accent-success)]/10 text-[var(--accent-success)] border-[var(--border-subtle)]'
      case 'IN_PROGRESS':
        return 'bg-[var(--accent-primary-weak)] text-[var(--accent-primary)] border-[var(--border-subtle)]'
      case 'TODO':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'HIGH':
        return 'bg-[var(--accent-warning)]/10 text-[var(--accent-warning)] border-[var(--border-subtle)]'
      case 'MEDIUM':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'LOW':
        return 'bg-[var(--accent-primary-weak)] text-[var(--accent-primary)] border-[var(--border-subtle)]'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  const getAssigneeName = (userId?: string | null) => {
    if (!userId) return 'Unassigned'
    const user = users.find(u => u.id === userId)
    return user ? user.name : 'Unknown'
  }

  if (taskLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="p-4">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Task not found</p>
          <Button onClick={handleBackNavigation} className="mt-4">
            {getBackButtonText()}
          </Button>
        </div>
      </div>
    )
  }

  const progress = subtasks.length > 0
    ? (subtasks.filter((s: Subtask) => s.status === 'DONE').length / subtasks.length) * 100
    : 0

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={handleBackNavigation}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {getBackButtonText()}
        </Button>
        <div className="flex gap-2">
          <Button onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Task Title and Status */}
      <div className="mb-6">
        <div className="flex items-start gap-3 mb-3">
          <h1 className="text-2xl font-bold flex-1">{task.title}</h1>
          <Badge className={getStatusColor(task.status)}>
            {task.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description - Only show if has content or is being edited */}
          {(task.description || isEditingDescription) && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Description</CardTitle>
                  {!isEditingDescription ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setDescriptionText(task.description || '')
                        setIsEditingDescription(true)
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditingDescription(false)
                          setDescriptionText('')
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateDescriptionMutation.mutate(descriptionText)}
                        disabled={updateDescriptionMutation.isPending}
                      >
                        {updateDescriptionMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : null}
                        Save
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isEditingDescription ? (
                  <Textarea
                    value={descriptionText}
                    onChange={(e) => setDescriptionText(e.target.value)}
                    placeholder="Enter task description..."
                    className="min-h-[100px]"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {task.description}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Attachments - Compact */}
          <Card>
            <CardContent className="pt-4 pb-4">
              {taskId && <AttachmentSection entityType="TASK" entityId={taskId} />}
            </CardContent>
          </Card>

          {/* Subtasks */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Subtasks</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {subtasks.filter((s: Subtask) => s.status === 'DONE').length} of {subtasks.length} completed
                  </p>
                </div>
                <Button onClick={() => setIsCreateSubtaskOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Subtask
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Progress bar */}
              {subtasks.length > 0 && (
                <div className="w-full bg-secondary rounded-full h-2 mb-4">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}

              {subtasksLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : subtasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No subtasks yet
                </p>
              ) : (
                <div className="space-y-2">
                  {subtasks.map((subtask: Subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent group"
                    >
                      <Checkbox
                        checked={subtask.status === 'DONE'}
                        onCheckedChange={(checked) => {
                          toggleSubtaskMutation.mutate({
                            subtaskId: subtask.id,
                            newStatus: checked ? 'DONE' : 'TODO'
                          })
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/app/projects/${projectId}/tasks/${taskId}/subtasks/${subtask.id}`)}>
                        <p className={`text-sm font-medium ${subtask.status === 'DONE' ? 'line-through text-muted-foreground' : ''}`}>
                          {subtask.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {subtask.status}
                          </Badge>
                          {subtask.priority && (
                            <Badge variant="outline" className="text-xs">
                              {subtask.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Select
                          value={subtask.assignedTo || 'UNASSIGNED'}
                          onValueChange={(value) => {
                            subtaskService.updateSubtask(taskId!, subtask.id, {
                              assignedTo: value === 'UNASSIGNED' ? undefined : value
                            }).then(() => {
                              queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] })
                              queryClient.invalidateQueries({ queryKey: ['subtask', taskId, subtask.id] })
                              toast.success('Assignee updated')
                            })
                          }}
                        >
                          <SelectTrigger className="w-[140px] h-8">
                            <SelectValue placeholder="Assign" />
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
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingSubtask(subtask)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm('Delete this subtask?')) {
                              deleteSubtaskMutation.mutate(subtask.id)
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Comments</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CommentSection entityType="TASK" entityId={taskId!} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Priority */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Priority</p>
                <Badge className={getPriorityColor(task.priority || 'MEDIUM')}>
                  {task.priority || 'MEDIUM'}
                </Badge>
              </div>

              {/* Status */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Badge className={getStatusColor(task.status)}>
                  {task.status}
                </Badge>
              </div>

              {/* Story Points - Editable */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Story Points</p>
                <Select
                  value={task.storyPoints?.toString() || 'unset'}
                  onValueChange={(value) => {
                    const storyPoints = value === 'unset' ? undefined : value
                    taskService.patchTask(taskId!, { storyPoints }).then(() => {
                      queryClient.invalidateQueries({ queryKey: ['task', taskId] })
                      if (task?.projectId) {
                        queryClient.invalidateQueries({ queryKey: ['tasks', task.projectId] })
                      }
                      toast.success('Story points updated')
                    })
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unset">Not set</SelectItem>
                    <SelectItem value="0">0</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="8">8</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Created By */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Created By</p>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {task.createdBy ? getAssigneeName(task.createdBy) : 'Unknown'}
                  </p>
                </div>
              </div>

              {/* Assignee Dropdown */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Assigned To</p>
                <Select
                  value={task.assignedTo || 'UNASSIGNED'}
                  onValueChange={(value) => {
                    updateAssigneeMutation.mutate(value === 'UNASSIGNED' ? undefined : value)
                  }}
                >
                  <SelectTrigger className="w-full">
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

              {/* Team */}
              {task.teamId && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Team</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {teams.find(t => t.id === task.teamId)?.name || 'Unknown Team'}
                    </p>
                  </div>
                </div>
              )}

              {/* Due Date */}
              {task.dueDate && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Due Date</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              )}

              {/* Created Date */}
              {task.createdAt && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {format(new Date(task.createdAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Task Dialog */}
      {task && (
        <TaskFormDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          projectId={task.projectId || projectId!}
          task={task}
        />
      )}

      {/* Create/Edit Subtask Dialog */}
      <SubtaskFormDialog
        open={isCreateSubtaskOpen || !!editingSubtask}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateSubtaskOpen(false)
            setEditingSubtask(null)
          }
        }}
        taskId={taskId!}
        subtask={editingSubtask}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
              All subtasks and comments will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
