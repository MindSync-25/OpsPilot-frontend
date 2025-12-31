/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck - Form field render props typing is complex
import { useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, Calendar as CalendarIcon } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import './datepicker-custom.css'
import { clientService } from '@/services/clientService'
import { userService } from '@/services/userService'
import { 
  type CreateProjectRequest, 
  type Project,
  ProjectStatus,
  ProjectPriority 
} from '@/services/projectService'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
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

// Validation schema
const projectFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  clientId: z.string().nullable().optional(),
  projectOwnerId: z.string().nullable().optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate)
  }
  return true
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
})

type ProjectFormData = z.infer<typeof projectFormSchema>

interface ProjectFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateProjectRequest) => void
  project?: Project
}

export default function ProjectFormDialog({
  open,
  onOpenChange,
  onSubmit,
  project,
}: ProjectFormDialogProps) {
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: '',
      description: '',
      clientId: '',
      projectOwnerId: '',
      status: 'PLANNING' as const,
      priority: 'MEDIUM' as const,
      startDate: '',
      endDate: '',
    },
  })
  
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientService.getClients(),
    enabled: open,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
  
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
    enabled: open,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
  
  const isEdit = !!project
  const isLoading = form.formState.isSubmitting || clientsLoading || usersLoading

  // Reset form when dialog opens/closes or project changes
  useEffect(() => {
    if (open) {
      if (project) {
        form.reset({
          name: project.name,
          description: project.description || '',
          clientId: project.clientId,
          projectOwnerId: project.projectOwnerId || '',
          status: project.status,
          priority: project.priority,
          startDate: project.startDate || '',
          endDate: project.endDate || '',
        })
      } else {
        form.reset({
          name: '',
          description: '',
          clientId: '',
          projectOwnerId: '',
          status: 'PLANNING' as const,
          priority: 'MEDIUM' as const,
          startDate: '',
          endDate: '',
        })
      }
    }
  }, [open, project, form])

  const handleSubmit = (data: ProjectFormData) => {
    console.log('=== handleSubmit called ===')
    console.log('Raw form data:', data)
    
    // Clean up the data - remove clientId if it's empty or undefined
    const submitData: any = { ...data }
    
    // Remove clientId if it's empty or undefined
    if (!submitData.clientId) {
      delete submitData.clientId
    }
    
    // Convert empty projectOwnerId to null instead of deleting it
    // This ensures the backend can clear the field when needed
    if (!submitData.projectOwnerId) {
      submitData.projectOwnerId = null
    }
    
    // Remove startDate if empty
    if (!submitData.startDate) {
      delete submitData.startDate
    }
    
    // Remove endDate if empty
    if (!submitData.endDate) {
      delete submitData.endDate
    }
    
    console.log('Cleaned project data:', submitData)
    console.log('Calling onSubmit prop...')
    onSubmit(submitData)
    console.log('onSubmit prop called')
  }

  const handleFormError = (errors: any) => {
    console.log('=== Form validation FAILED ===')
    console.log('Validation errors:', errors)
  }

  const onFormSubmit = (e: React.FormEvent) => {
    console.log('=== Form submit event triggered ===')
    console.log('Form state:', {
      isValid: form.formState.isValid,
      errors: form.formState.errors,
      isDirty: form.formState.isDirty,
      isSubmitting: form.formState.isSubmitting
    })
    e.preventDefault()
    e.stopPropagation()
    form.handleSubmit(handleSubmit, handleFormError)(e)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => {
        // Prevent dialog from closing when clicking on calendar/popover
        e.preventDefault()
      }}>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Project' : 'Create New Project'}</DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Update the project details below.' 
              : 'Add a new project to your workspace. Fill in the details below.'
            }
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit, handleFormError)}>
            <div className="space-y-4">
            {/* Project Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Project Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter project name" 
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter project description (optional)" 
                      rows={3}
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Client */}
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.length === 0 ? (
                        <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                          No clients available. You can create a project without a client.
                        </div>
                      ) : (
                        clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Project Owner */}
            <FormField
              control={form.control}
              name="projectOwnerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Owner</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project owner (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.length === 0 ? (
                        <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                          No users available.
                        </div>
                      ) : (
                        users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={ProjectStatus.PLANNING}>Planning</SelectItem>
                        <SelectItem value={ProjectStatus.ACTIVE}>Active</SelectItem>
                        <SelectItem value={ProjectStatus.ON_HOLD}>On Hold</SelectItem>
                        <SelectItem value={ProjectStatus.COMPLETED}>Completed</SelectItem>
                        <SelectItem value={ProjectStatus.CANCELLED}>Cancelled</SelectItem>
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={ProjectPriority.LOW}>Low</SelectItem>
                        <SelectItem value={ProjectPriority.MEDIUM}>Medium</SelectItem>
                        <SelectItem value={ProjectPriority.HIGH}>High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Start Date */}
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DatePicker
                          selected={field.value ? new Date(field.value) : null}
                          onChange={(date) => {
                            field.onChange(date ? date.toISOString().split('T')[0] : '')
                          }}
                          dateFormat="MMM dd, yyyy"
                          placeholderText="Select start date"
                          disabled={isLoading}
                          showMonthDropdown
                          showYearDropdown
                          dropdownMode="select"
                          yearDropdownItemNumber={15}
                          scrollableYearDropdown
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          wrapperClassName="w-full"
                        />
                        <CalendarIcon className="absolute right-3 top-3 h-4 w-4 opacity-50 pointer-events-none" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Date */}
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DatePicker
                          selected={field.value ? new Date(field.value) : null}
                          onChange={(date) => {
                            field.onChange(date ? date.toISOString().split('T')[0] : '')
                          }}
                          dateFormat="MMM dd, yyyy"
                          placeholderText="Select end date"
                          disabled={isLoading}
                          minDate={form.watch('startDate') ? new Date(form.watch('startDate')) : undefined}
                          showMonthDropdown
                          showYearDropdown
                          dropdownMode="select"
                          yearDropdownItemNumber={15}
                          scrollableYearDropdown
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          wrapperClassName="w-full"
                        />
                        <CalendarIcon className="absolute right-3 top-3 h-4 w-4 opacity-50 pointer-events-none" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? 'Update Project' : 'Create Project'}
            </Button>
          </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}
