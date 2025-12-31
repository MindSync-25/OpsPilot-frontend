import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, User, Calendar, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { subtaskService } from '@/services/subtaskService'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CommentSection } from '@/components/common/CommentSection'
import { SubtaskFormDialog } from './SubtaskFormDialog'
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

interface SubtaskDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskId: string
  subtaskId: string
}

export function SubtaskDetailDialog({
  open,
  onOpenChange,
  taskId,
  subtaskId,
}: SubtaskDetailDialogProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  // Fetch subtask details
  const { data: subtask, isLoading } = useQuery({
    queryKey: ['subtask', taskId, subtaskId],
    queryFn: () => subtaskService.getSubtaskById(taskId, subtaskId),
    enabled: open && !!taskId && !!subtaskId,
  })

  const deleteMutation = useMutation({
    mutationFn: () => subtaskService.deleteSubtask(taskId, subtaskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] })
      toast.success('Subtask deleted successfully')
      onOpenChange(false)
    },
    onError: () => {
      toast.error('Failed to delete subtask')
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE':
        return 'bg-green-500'
      case 'IN_PROGRESS':
        return 'bg-blue-500'
      case 'TODO':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-500'
      case 'HIGH':
        return 'bg-orange-500'
      case 'MEDIUM':
        return 'bg-yellow-500'
      case 'LOW':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl">
                {isLoading ? 'Loading...' : subtask?.title}
              </DialogTitle>
              {!isLoading && subtask && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getStatusColor(subtask.status)}>
                    {subtask.status.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline" className={getPriorityColor(subtask.priority || 'MEDIUM')}>
                    {subtask.priority || 'MEDIUM'} PRIORITY
                  </Badge>
                </div>
              )}
            </div>
            {!isLoading && subtask && (
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

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : subtask ? (
          <div className="space-y-6">
            {/* Description */}
            {subtask.description && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {subtask.description}
                </p>
              </div>
            )}

            {/* Subtask metadata */}
            <div className="grid grid-cols-2 gap-4">
              {subtask.assignedTo && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Assigned To</p>
                    <p className="text-sm font-medium">{subtask.assignedTo}</p>
                  </div>
                </div>
              )}
              {subtask.dueDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Due Date</p>
                    <p className="text-sm font-medium">
                      {format(new Date(subtask.dueDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Comments */}
            <CommentSection entityType="SUBTASK" entityId={subtaskId} />
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-12">
            Subtask not found
          </p>
        )}
      </DialogContent>

      {/* Edit Subtask Dialog */}
      {subtask && (
        <SubtaskFormDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          taskId={taskId}
          subtask={subtask}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subtask</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this subtask? This action cannot be undone.
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
