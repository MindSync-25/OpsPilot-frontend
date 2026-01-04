import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Calendar, User, CheckCircle2, Pencil, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { taskService } from '@/services/taskService'
import { subtaskService, type Subtask } from '@/services/subtaskService'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { CommentSection } from '@/components/common/CommentSection'
import { SubtaskFormDialog } from './SubtaskFormDialog'
import { SubtaskDetailDialog } from './SubtaskDetailDialog'
import TaskFormDialog from './TaskFormDialog'
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

interface TaskDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskId: string
}

export function TaskDetailDialog({
  open,
  onOpenChange,
  taskId,
}: TaskDetailDialogProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isCreateSubtaskOpen, setIsCreateSubtaskOpen] = useState(false)
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null)
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // Fetch task details
  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => taskService.getTask(taskId),
    enabled: open && !!taskId,
  })

  // Fetch subtasks
  const { data: subtasks = [], isLoading: subtasksLoading } = useQuery({
    queryKey: ['subtasks', taskId],
    queryFn: () => subtaskService.getSubtasks(taskId),
    enabled: open && !!taskId,
  })

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: () => taskService.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task deleted successfully')
      onOpenChange(false)
    },
    onError: () => {
      toast.error('Failed to delete task')
    },
  })

  // Delete subtask mutation
  const deleteSubtaskMutation = useMutation({
    mutationFn: (subtaskId: string) => subtaskService.deleteSubtask(taskId, subtaskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] })
      toast.success('Subtask deleted')
    },
    onError: () => {
      toast.error('Failed to delete subtask')
    },
  })

  // Toggle subtask status
  const toggleSubtaskMutation = useMutation({
    mutationFn: ({ subtaskId, newStatus }: { subtaskId: string; newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE' }) =>
      subtaskService.updateSubtask(taskId, subtaskId, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] })
    },
    onError: () => {
      toast.error('Failed to update subtask')
    },
  })

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

  const getPriorityColor = (priority: string) => {
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

  const completedSubtasks = subtasks.filter((s: Subtask) => s.status === 'DONE').length
  const progress = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl">
                {taskLoading ? 'Loading...' : task?.title}
              </DialogTitle>
              {!taskLoading && task && (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge className={getStatusColor(task.status)}>
                    {task.status.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline" className={getPriorityColor(task.priority || 'MEDIUM')}>
                    {task.priority || 'MEDIUM'} PRIORITY
                  </Badge>
                </div>
              )}
            </div>
            {!taskLoading && task && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        {taskLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : task ? (
          <div className="space-y-6">
            {/* Description */}
            {task.description && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>
            )}

            {/* Task metadata */}
            <div className="grid grid-cols-2 gap-4">
              {task.assignedTo && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Assigned To</p>
                    <p className="text-sm font-medium">{task.assignedTo}</p>
                  </div>
                </div>
              )}
              {task.dueDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Due Date</p>
                    <p className="text-sm font-medium">
                      {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Subtasks */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <h3 className="text-sm font-semibold">
                    Subtasks ({completedSubtasks}/{subtasks.length})
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground">
                    {Math.round(progress)}% complete
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setIsCreateSubtaskOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Subtask
                  </Button>
                </div>
              </div>
              
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
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent group cursor-pointer"
                      onClick={() => setSelectedSubtaskId(subtask.id)}
                    >
                      <Checkbox
                        checked={subtask.status === 'DONE'}
                        onCheckedChange={(checked) => {
                          toggleSubtaskMutation.mutate({
                            subtaskId: subtask.id,
                            newStatus: checked ? 'DONE' : 'TODO'
                          })
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
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
                          {subtask.assignedTo && (
                            <Badge variant="secondary" className="text-xs">
                              <User className="h-3 w-3 mr-1" />
                              Assigned
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
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
            </div>

            <Separator />

            {/* Comments */}
            <CommentSection entityType="TASK" entityId={taskId} />
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-12">
            Task not found
          </p>
        )}
      </DialogContent>

      {/* Edit Task Dialog */}
      {task && task.projectId && (
        <TaskFormDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          projectId={task.projectId}
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
        taskId={taskId}
        subtask={editingSubtask}
      />

      {/* Subtask Detail Dialog */}
      {selectedSubtaskId && (
        <SubtaskDetailDialog
          open={!!selectedSubtaskId}
          onOpenChange={(open) => {
            if (!open) setSelectedSubtaskId(null)
          }}
          taskId={taskId}
          subtaskId={selectedSubtaskId}
        />
      )}

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
    </Dialog>
  )
}
