import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Calendar, Pencil, Trash2, Plus, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { phaseService } from '@/services/phaseService'
import { taskService, type Task } from '@/services/taskService'
import { teamService } from '@/services/teamService'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CommentSection } from '@/components/common/CommentSection'
import { AttachmentSection } from '@/components/common/AttachmentSection'
import { PhaseFormDialog } from '@/components/phases/PhaseFormDialog'
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

export default function PhaseDetailPage() {
  const { projectId, phaseId } = useParams<{ projectId: string; phaseId: string }>()
  const navigate = useNavigate()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [descriptionText, setDescriptionText] = useState('')
  const queryClient = useQueryClient()

  // Fetch phase details
  const { data: phase, isLoading: phaseLoading } = useQuery({
    queryKey: ['phase', projectId, phaseId],
    queryFn: () => phaseService.getPhaseById(projectId!, phaseId!),
    enabled: !!projectId && !!phaseId,
  })

  // Fetch tasks for this phase
  const { data: allTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => taskService.getTasks({ projectId: projectId! }),
    enabled: !!projectId,
  })

  // Filter tasks for this phase
  const phaseTasks = allTasks.filter((task: Task) => task.phaseId === phaseId)

  // Fetch teams for team lookup
  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamService.getTeams(),
  })

  // Delete phase mutation
  const deleteMutation = useMutation({
    mutationFn: () => phaseService.deletePhase(projectId!, phaseId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phases', projectId] })
      toast.success('Phase deleted successfully')
      navigate(`/app/projects/${projectId}`)
    },
    onError: () => {
      toast.error('Failed to delete phase')
    },
  })

  // Update description mutation
  const updateDescriptionMutation = useMutation({
    mutationFn: (description: string) =>
      phaseService.updatePhase(projectId!, phaseId!, { description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase', projectId, phaseId] })
      queryClient.invalidateQueries({ queryKey: ['phases', projectId] })
      toast.success('Description updated')
      setIsEditingDescription(false)
    },
    onError: () => {
      toast.error('Failed to update description')
    },
  })

  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: (teamId: string | undefined) =>
      phaseService.updatePhase(projectId!, phaseId!, { teamId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase', projectId, phaseId] })
      queryClient.invalidateQueries({ queryKey: ['phases', projectId] })
      toast.success('Team updated')
    },
    onError: () => {
      toast.error('Failed to update team')
    },
  })

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (status: 'TODO' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED') =>
      phaseService.updatePhase(projectId!, phaseId!, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase', projectId, phaseId] })
      queryClient.invalidateQueries({ queryKey: ['phases', projectId] })
      toast.success('Status updated')
    },
    onError: () => {
      toast.error('Failed to update status')
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'bg-gray-500'
      case 'ACTIVE':
        return 'bg-[var(--accent-success)]'
      case 'COMPLETED':
        return 'bg-[var(--accent-primary)]'
      case 'ARCHIVED':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-500'
      case 'MEDIUM':
        return 'bg-yellow-500'
      case 'LOW':
        return 'bg-[var(--accent-success)]'
      default:
        return 'bg-gray-500'
    }
  }

  if (phaseLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!phase) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-xl font-bold mb-2">Phase not found</h2>
        <Button onClick={() => navigate(`/app/projects/${projectId}`)}>
          Back to Project
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header with back button */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/app/projects/${projectId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex-1" />
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {/* Phase Title and Status */}
      <div className="mb-6">
        <div className="flex items-start gap-3 mb-3">
          <h1 className="text-2xl font-bold flex-1">{phase.name}</h1>
          <Badge className={getStatusColor(phase.status)}>
            {phase.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Description</CardTitle>
                {!isEditingDescription ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setDescriptionText(phase.description || '')
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
                  placeholder="Enter phase description..."
                  className="min-h-[120px]"
                />
              ) : phase.description ? (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {phase.description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No description provided
                </p>
              )}
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardContent className="pt-6">
              {phaseId && <AttachmentSection entityType="PHASE" entityId={phaseId} />}
            </CardContent>
          </Card>

          {/* Tasks */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tasks</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {phaseTasks.filter((t: Task) => t.status === 'DONE').length} of {phaseTasks.length} completed
                  </p>
                </div>
                <Button 
                  onClick={() => navigate(`/app/projects/${projectId}`)} 
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Task
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : phaseTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No tasks in this phase yet
                </p>
              ) : (
                <div className="space-y-2">
                  {phaseTasks.map((task: Task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => navigate(`/app/projects/${projectId}/tasks/${task.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${task.status === 'DONE' ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {task.status}
                          </Badge>
                          {task.priority && (
                            <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </Badge>
                          )}
                          {task.storyPoints && (
                            <Badge variant="outline" className="text-xs">
                              {task.storyPoints} pts
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <CommentSection entityType="PHASE" entityId={phaseId!} />
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
              {/* Status */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Select
                  value={phase.status}
                  onValueChange={(value) => {
                    updateStatusMutation.mutate(value as 'TODO' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED')
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">To Do</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Assigned Team */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Assigned Team</p>
                {phase.teamName ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{phase.teamName}</p>
                    <Select
                      value={phase.teamId || 'NO_TEAM'}
                      onValueChange={(value) => {
                        updateTeamMutation.mutate(value === 'NO_TEAM' ? undefined : value)
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Change team..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NO_TEAM">No Team</SelectItem>
                        {teams.map(team => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <Select
                    value={phase.teamId || 'NO_TEAM'}
                    onValueChange={(value) => {
                      updateTeamMutation.mutate(value === 'NO_TEAM' ? undefined : value)
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NO_TEAM">No Team</SelectItem>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Sort Order */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Sort Order</p>
                <p className="text-sm font-medium">{phase.sortOrder}</p>
              </div>

              {/* Task Count */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Tasks</p>
                <p className="text-sm font-medium">{phase.taskCount || phaseTasks.length}</p>
              </div>

              {/* Created Date */}
              {phase.createdAt && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {format(new Date(phase.createdAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              )}

              {/* Updated Date */}
              {phase.updatedAt && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {format(new Date(phase.updatedAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Phase Dialog */}
      {phase && (
        <PhaseFormDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          projectId={projectId!}
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
              All tasks in this phase will be unassigned from the phase.
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
