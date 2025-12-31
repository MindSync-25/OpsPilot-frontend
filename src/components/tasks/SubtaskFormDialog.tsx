import { useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { subtaskService, type CreateSubtaskRequest } from '@/services/subtaskService'
import { userService } from '@/services/userService'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

const subtaskSchema = z.object({
  title: z.string().min(1, 'Subtask title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
  storyPoints: z.string().optional(),
})

type SubtaskFormValues = z.infer<typeof subtaskSchema>

interface SubtaskFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskId: string
  subtask?: any
  parentSubtaskId?: string
}

export function SubtaskFormDialog({
  open,
  onOpenChange,
  taskId,
  subtask,
  parentSubtaskId,
}: SubtaskFormDialogProps) {
  const queryClient = useQueryClient()

  const form = useForm<SubtaskFormValues>({
    resolver: zodResolver(subtaskSchema),
    defaultValues: {
      title: subtask?.title || '',
      description: subtask?.description || '',
      status: subtask?.status || 'TODO',
      priority: subtask?.priority || 'MEDIUM',
      assignedTo: subtask?.assignedTo || '',
      dueDate: subtask?.dueDate ? subtask.dueDate.split('T')[0] : '',
    },
  })

  useEffect(() => {
    if (subtask) {
      form.reset({
        title: subtask.title || '',
        description: subtask.description || '',
        status: subtask.status || 'TODO',
        priority: subtask.priority || 'MEDIUM',
        assignedTo: subtask.assignedTo || '',
        dueDate: subtask.dueDate ? subtask.dueDate.split('T')[0] : '',
        storyPoints: subtask.storyPoints || '',
      })
    } else {
      form.reset({
        title: '',
        description: '',
        status: 'TODO',
        priority: 'MEDIUM',
        assignedTo: '',
        dueDate: '',
        storyPoints: '',
      })
    }
  }, [subtask, open, form])

  const { data: users = [] } = useQuery({
    queryKey: ['users-for-assignment'],
    queryFn: () => userService.getUsersForAssignment(),
    enabled: open,
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateSubtaskRequest) =>
      subtaskService.createSubtask(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] })
      toast.success('Subtask created successfully')
      onOpenChange(false)
      form.reset()
    },
    onError: () => {
      toast.error('Failed to create subtask')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) =>
      subtaskService.updateSubtask(taskId, subtask.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', taskId] })
      toast.success('Subtask updated successfully')
      onOpenChange(false)
    },
    onError: () => {
      toast.error('Failed to update subtask')
    },
  })

  const handleSubmit = (data: SubtaskFormValues) => {
    const cleanedData = {
      ...data,
      title: data.title.trim(),
      description: data.description?.trim() || undefined,
      assignedTo: data.assignedTo || undefined,
      dueDate: data.dueDate?.trim() || undefined,
      parentSubtaskId: parentSubtaskId || undefined,
    }

    if (subtask) {
      updateMutation.mutate(cleanedData)
    } else {
      createMutation.mutate(cleanedData)
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{subtask ? 'Edit Subtask' : 'Create Subtask'}</DialogTitle>
          <DialogDescription>
            {subtask ? 'Update the subtask details' : 'Add a new subtask to this task'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Subtask title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe this subtask..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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

              <FormField
                control={form.control}
                name="priority"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Assignee</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === 'UNASSIGNED' ? undefined : value)} 
                      value={field.value || 'UNASSIGNED'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                        {users.map((user: any) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName} {user.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {subtask ? 'Update Subtask' : 'Create Subtask'}
              </Button>
            </div>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
