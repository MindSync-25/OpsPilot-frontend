import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Calendar, User, Pencil, Trash2, ArrowLeft, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { subtaskService, type Subtask } from '@/services/subtaskService'
import { userService } from '@/services/userService'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CommentSection } from '@/components/common/CommentSection'
import { AttachmentSection } from '@/components/common/AttachmentSection'
import { SubtaskFormDialog } from '@/components/tasks/SubtaskFormDialog'
import { Checkbox } from '@/components/ui/checkbox'
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

export default function SubtaskDetailPage() {
  const { projectId, taskId, subtaskId } = useParams<{ projectId: string; taskId: string; subtaskId: string }>()
  const navigate = useNavigate()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isCreateChildSubtaskOpen, setIsCreateChildSubtaskOpen] = useState(false)
  const [editingChildSubtask, setEditingChildSubtask] = useState<Subtask | null>(null)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [descriptionText, setDescriptionText] = useState('')
  const queryClient = useQueryClient()

  // Fetch subtask details
  const { data: subtask, isLoading: subtaskLoading } = useQuery({
    queryKey: ['subtask', taskId, subtaskId],
    queryFn: () => subtaskService.getSubtaskById(taskId!, subtaskId!),
    enabled: !!taskId && !!subtaskId,
  })

  // Fetch child subtasks (subtasks of this subtask)
  const { data: allSubtasks = [], isLoading: childSubtasksLoading } = useQuery({
    queryKey: ['subtasks', taskId],
    queryFn: () => subtaskService.getSubtasks(taskId!),
    enabled: !!taskId,
  })

  // Filter to get only child subtasks
  const childSubtasks = allSubtasks.filter((s: Subtask) => s.parentSubtaskId === subtaskId)

  // Fetch users for assignee lookup
  const { data: users = [] } = useQuery({
    queryKey: ['users-for-assignment'],
    queryFn: () => userService.getUsersForAssignment(),
  })

  // Delete subtask mutation
  const deleteMutation = useMutation({
    mutationFn: () => subtaskService.deleteSubtask(taskId!, subtaskId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] })
      toast.success('Subtask deleted successfully')
      navigate(`/app/projects/${projectId}/tasks/${taskId}`)
    },
    onError: () => {
      toast.error('Failed to delete subtask')
    },
  })

  // Update subtask assignee mutation
  const updateAssigneeMutation = useMutation({
    mutationFn: (assignedTo: string | undefined) =>
      subtaskService.updateSubtask(taskId!, subtaskId!, { assignedTo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtask', taskId, subtaskId] })
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] })
      toast.success('Assignee updated successfully')
    },
  })

  // Update description mutation
  const updateDescriptionMutation = useMutation({
    mutationFn: (description: string) =>
      subtaskService.updateSubtask(taskId!, subtaskId!, { description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtask', taskId, subtaskId] })
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] })
      setIsEditingDescription(false)
      toast.success('Description updated successfully')
    },
  })

  // Toggle child subtask status
  const toggleChildSubtaskMutation = useMutation({
    mutationFn: ({ childSubtaskId, newStatus }: { childSubtaskId: string; newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE' }) =>
      subtaskService.updateSubtask(taskId!, childSubtaskId, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] })
    },
  })

  // Delete child subtask mutation
  const deleteChildSubtaskMutation = useMutation({
    mutationFn: (childSubtaskId: string) => subtaskService.deleteSubtask(taskId!, childSubtaskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] })
      toast.success('Subtask deleted successfully')
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

  const getAssigneeName = (userId?: string) => {
    if (!userId) return 'Unassigned'
    const user = users.find(u => u.id === userId)
    return user ? user.name : 'Unknown'
  }

  if (subtaskLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!subtask) {
    return (
      <div className="p-4">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Subtask not found</p>
          <Button onClick={() => navigate(`/app/projects/${projectId}/tasks/${taskId}`)} className="mt-4">
            Back to Task
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/app/projects/${projectId}/tasks/${taskId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Task
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

      {/* Subtask Title and Status */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
          <span>Subtask</span>
        </div>
        <div className="flex items-start gap-3 mb-3">
          <h1 className="text-2xl font-bold flex-1">{subtask.title}</h1>
          <Badge className={getStatusColor(subtask.status)}>
            {subtask.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description - Only show if has content or is being edited */}
          {(subtask.description || isEditingDescription) && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Description</CardTitle>
                  {!isEditingDescription ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setDescriptionText(subtask.description || '')
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
                    placeholder="Enter subtask description..."
                    className="min-h-[100px]"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {subtask.description}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Attachments - Compact */}
          <Card>
            <CardContent className="pt-4 pb-4">
              {subtaskId && <AttachmentSection entityType="SUBTASK" entityId={subtaskId} />}
            </CardContent>
          </Card>

          {/* Child Subtasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Subtasks</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {childSubtasks.filter((s: Subtask) => s.status === 'DONE').length} of {childSubtasks.length} completed
                </p>
              </div>
              <Button onClick={() => setIsCreateChildSubtaskOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Subtask
              </Button>
            </CardHeader>
            <CardContent>
              {childSubtasks.length > 0 && (
                <div className="w-full bg-secondary rounded-full h-2 mb-4">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${(childSubtasks.filter((s: Subtask) => s.status === 'DONE').length / childSubtasks.length) * 100}%` }}
                  />
                </div>
              )}

              {childSubtasksLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : childSubtasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No subtasks yet
                </p>
              ) : (
                <div className="space-y-2">
                  {childSubtasks.map((childSubtask: Subtask) => (
                    <div
                      key={childSubtask.id}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent group"
                    >
                      <Checkbox
                        checked={childSubtask.status === 'DONE'}
                        onCheckedChange={(checked) => {
                          toggleChildSubtaskMutation.mutate({
                            childSubtaskId: childSubtask.id,
                            newStatus: checked ? 'DONE' : 'TODO'
                          })
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/app/projects/${projectId}/tasks/${taskId}/subtasks/${childSubtask.id}`)}>
                        <p className={`text-sm font-medium ${childSubtask.status === 'DONE' ? 'line-through text-muted-foreground' : ''}`}>
                          {childSubtask.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {childSubtask.status}
                          </Badge>
                          {childSubtask.priority && (
                            <Badge variant="outline" className="text-xs">
                              {childSubtask.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Select
                          value={childSubtask.assignedTo || 'UNASSIGNED'}
                          onValueChange={(value) => {
                            subtaskService.updateSubtask(taskId!, childSubtask.id, {
                              assignedTo: value === 'UNASSIGNED' ? undefined : value
                            }).then(() => {
                              queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] })
                              queryClient.invalidateQueries({ queryKey: ['subtask', taskId, childSubtask.id] })
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
                          onClick={() => setEditingChildSubtask(childSubtask)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm('Delete this subtask?')) {
                              deleteChildSubtaskMutation.mutate(childSubtask.id)
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
              <CommentSection entityType="SUBTASK" entityId={subtaskId!} />
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
                <Badge className={getPriorityColor(subtask.priority || 'MEDIUM')}>
                  {subtask.priority || 'MEDIUM'}
                </Badge>
              </div>

              {/* Status */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Badge className={getStatusColor(subtask.status)}>
                  {subtask.status}
                </Badge>
              </div>

              {/* Story Points - Editable */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Story Points</p>
                <Select
                  value={subtask.storyPoints?.toString() || 'unset'}
                  onValueChange={(value) => {
                    const storyPoints = value === 'unset' ? undefined : value
                    subtaskService.updateSubtask(taskId!, subtaskId!, { storyPoints }).then(() => {
                      queryClient.invalidateQueries({ queryKey: ['subtask', taskId, subtaskId] })
                      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] })
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

              {/* Assignee Dropdown */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Assigned To</p>
                <Select
                  value={subtask.assignedTo || 'UNASSIGNED'}
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

              {/* Due Date */}
              {subtask.dueDate && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Due Date</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {format(new Date(subtask.dueDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              )}

              {/* Created Date */}
              {subtask.createdAt && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {format(new Date(subtask.createdAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              )}

              {/* Created By */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Created By</p>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {subtask.createdBy ? getAssigneeName(subtask.createdBy) : 'Unknown'}
                  </p>
                </div>
              </div>

              {/* Sort Order */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Sort Order</p>
                <p className="text-sm font-medium">#{subtask.sortOrder}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Subtask Dialog */}
      <SubtaskFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        taskId={taskId!}
        subtask={subtask}
      />

      {/* Create Child Subtask Dialog */}
      <SubtaskFormDialog
        open={isCreateChildSubtaskOpen}
        onOpenChange={setIsCreateChildSubtaskOpen}
        taskId={taskId!}
        parentSubtaskId={subtaskId}
      />

      {/* Edit Child Subtask Dialog */}
      {editingChildSubtask && (
        <SubtaskFormDialog
          open={!!editingChildSubtask}
          onOpenChange={(open) => !open && setEditingChildSubtask(null)}
          taskId={taskId!}
          subtask={editingChildSubtask}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subtask</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this subtask? This action cannot be undone.
              All child subtasks and comments will also be deleted.
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
