import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, ListChecks, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { phaseService } from '@/services/phaseService'
import { taskService, type Task } from '@/services/taskService'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CommentSection } from '@/components/common/CommentSection'
import { PhaseFormDialog } from './PhaseFormDialog'
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

interface PhaseDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  phaseId: string
  projectId: string
}

export function PhaseDetailDialog({
  open,
  onOpenChange,
  phaseId,
  projectId,
}: PhaseDetailDialogProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  // Fetch phase details
  const { data: phase, isLoading: phaseLoading } = useQuery({
    queryKey: ['phase', phaseId],
    queryFn: () => phaseService.getPhaseById(projectId, phaseId),
    enabled: open && !!phaseId,
  })

  // Fetch tasks in this phase
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', projectId, phaseId],
    queryFn: () => taskService.getTasks(projectId, phaseId),
    enabled: open && !!phaseId,
  })

  const deleteMutation = useMutation({
    mutationFn: () => phaseService.deletePhase(projectId, phaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phases'] })
      toast.success('Phase deleted successfully')
      onOpenChange(false)
    },
    onError: () => {
      toast.error('Failed to delete phase')
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500'
      case 'COMPLETED':
        return 'bg-blue-500'
      case 'ON_HOLD':
        return 'bg-yellow-500'
      case 'CANCELLED':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl">
                {phaseLoading ? 'Loading...' : phase?.name}
              </DialogTitle>
              {!phaseLoading && phase && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getStatusColor(phase.status)}>
                    {phase.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Sort Order: {phase.sortOrder}
                  </span>
                </div>
              )}
            </div>
            {!phaseLoading && phase && (
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

        {phaseLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : phase ? (
          <div className="space-y-6">
            {/* Description */}
            {phase.description && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {phase.description}
                </p>
              </div>
            )}

            <Separator />

            {/* Tasks in this phase */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ListChecks className="h-5 w-5" />
                <h3 className="text-sm font-semibold">
                  Tasks ({tasks.length})
                </h3>
              </div>
              {tasksLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No tasks in this phase yet
                </p>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task: Task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {task.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Comments */}
            <CommentSection entityType="PHASE" entityId={phaseId} />
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-12">
            Phase not found
          </p>
        )}
      </DialogContent>

      {/* Edit Phase Dialog */}
      {phase && (
        <PhaseFormDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          projectId={projectId}
          phase={phase}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Phase</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this phase? This action cannot be undone.
              All tasks in this phase will become unassigned.
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
