import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { taskService } from '@/services/taskService'
import { userService } from '@/services/userService'
import { phaseService } from '@/services/phaseService'
import { teamService } from '@/services/teamService'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  phaseId: z.string().optional(),
  teamId: z.string().optional(),
  assigneeUserId: z.string().optional(),
  dueDate: z.string().optional(),
  storyPoints: z.string().optional(),
})

type TaskFormValues = z.infer<typeof taskFormSchema>

interface TaskFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: TaskFormValues) => void
  projectId: string
  selectedPhaseId?: string | null
  isSubmitting?: boolean
  task?: any // For editing
}

export default function TaskFormDialog({
  open,
  onOpenChange,
  onSubmit,
  projectId,
  selectedPhaseId = null,
  isSubmitting = false,
  task,
}: TaskFormDialogProps) {
  const queryClient = useQueryClient()

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      status: task?.status || 'TODO',
      priority: task?.priority || 'MEDIUM',
      phaseId: task?.phaseId || selectedPhaseId || '',
      teamId: task?.teamId || '',
      assigneeUserId: task?.assignedTo || '',
      dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
    },
  })

  // Reset form when task changes
  useState(() => {
    if (task) {
      form.reset({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'TODO',
        priority: task.priority || 'MEDIUM',
        phaseId: task.phaseId || '',
        teamId: task.teamId || '',
        assigneeUserId: task.assignedTo || '',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        storyPoints: task.storyPoints || '',
      })
    } else {
      form.reset({
        title: '',
        description: '',
        status: 'TODO',
        priority: 'MEDIUM',
        phaseId: selectedPhaseId || '',
        teamId: '',
        assigneeUserId: '',
        dueDate: '',
        storyPoints: '',
      })
    }
  })

  const updateTaskMutation = useMutation({
    mutationFn: (data: any) => taskService.updateTask(task.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task', task.id] })
      toast.success('Task updated successfully')
      onOpenChange(false)
    },
    onError: () => {
      toast.error('Failed to update task')
    },
  })

  // Fetch phases for this project
  const { data: phases = [] } = useQuery({
    queryKey: ['phases', projectId],
    queryFn: () => phaseService.getPhases(projectId),
    enabled: !!projectId && open,
  })

  // Fetch teams for team selector
  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamService.getTeams(),
    enabled: open,
  })

  // Fetch project members for assignee dropdown
  // TODO: Re-enable when backend endpoint is fixed
  // const { data: members = [] } = useQuery({
  //   queryKey: ['projectMembers', projectId],
  //   queryFn: () => projectService.getProjectMembers(projectId),
  //   enabled: !!projectId && open,
  // })
  const members: any[] = [] // Disabled due to 500 error

  // Fetch all users for assignee dropdown
  const { data: users = [] } = useQuery({
    queryKey: ['users-for-assignment'],
    queryFn: () => userService.getUsersForAssignment(),
    enabled: open,
  })

  const assigneeOptions = members.length > 0 
    ? members.map(m => ({ id: m.userId, name: m.userName || 'Unknown' }))
    : users.map(u => ({ id: u.id, name: u.name }))

  useEffect(() => {
    if (!open) {
      form.reset()
    } else if (selectedPhaseId) {
      form.setValue('phaseId', selectedPhaseId)
    }
  }, [open, selectedPhaseId, form])

  const handleSubmit = (data: TaskFormValues) => {
    // Get team from selected phase if no explicit team selected
    const selectedPhase = phases.find(p => p.id === data.phaseId)
    const resolvedTeamId = data.teamId || selectedPhase?.teamId || undefined
    
    // Clean up empty strings for optional fields - convert to undefined
    const cleanedData = {
      ...data,
      projectId, // Include projectId for updates
      description: data.description?.trim() || undefined,
      phaseId: data.phaseId || undefined,
      teamId: resolvedTeamId,
      assignedTo: data.assigneeUserId || undefined,
      dueDate: data.dueDate?.trim() || undefined,
    }
    
    if (task) {
      updateTaskMutation.mutate(cleanedData)
    } else if (onSubmit) {
      onSubmit(cleanedData)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Create Task'}</DialogTitle>
          <DialogDescription>
            {task ? 'Update the task details' : 'Add a new task to this project'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Task title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Task description..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phase */}
            <FormField
              control={form.control}
              name="phaseId"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Phase</FormLabel>
                  <Select
                    value={field.value || 'none'}
                    onValueChange={(value) => {
                      const newPhaseId = value === 'none' ? undefined : value
                      field.onChange(newPhaseId)
                      // Auto-assign team from phase
                      const selectedPhase = phases.find(p => p.id === newPhaseId)
                      if (selectedPhase?.teamId && !form.getValues('teamId')) {
                        form.setValue('teamId', selectedPhase.teamId)
                      }
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select phase (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No Phase</SelectItem>
                      {phases
                        .filter(p => p.status === 'TODO' || p.status === 'ACTIVE')
                        .map(phase => (
                          <SelectItem key={phase.id} value={phase.id}>
                            {phase.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Team - only show if phase not selected OR phase has no team */}
            {(!form.watch('phaseId') || !phases.find(p => p.id === form.watch('phaseId'))?.teamId) && (
              <FormField
                control={form.control}
                name="teamId"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Team</FormLabel>
                    <Select
                      value={field.value || 'none'}
                      onValueChange={(value) => field.onChange(value === 'none' ? undefined : value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select team (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Team</SelectItem>
                        {teams.map(team => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Show team info when auto-assigned from phase */}
            {form.watch('phaseId') && phases.find(p => p.id === form.watch('phaseId'))?.teamId && (
              <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                Team auto-assigned from phase: <span className="font-medium text-foreground">
                  {teams.find(t => t.id === phases.find(p => p.id === form.watch('phaseId'))?.teamId)?.name || 'Unknown'}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="TODO">To Do</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="DONE">Done</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Priority */}
              <FormField
                control={form.control}
                name="priority"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Assignee */}
              <FormField
                control={form.control}
                name="assigneeUserId"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Assignee</FormLabel>
                    <Select
                      value={field.value || 'unassigned'}
                      onValueChange={(value) => field.onChange(value === 'unassigned' ? undefined : value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {assigneeOptions.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Story Points */}
              <FormField
                control={form.control}
                name="storyPoints"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Story Points</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="8" 
                        placeholder="0-8" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Due Date */}
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={() => form.handleSubmit(handleSubmit)()}
                disabled={isSubmitting || updateTaskMutation.isPending}
              >
                {(isSubmitting || updateTaskMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {task ? 'Update Task' : 'Create Task'}
              </Button>
            </div>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
