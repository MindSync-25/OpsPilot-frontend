import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Users, Mail, Loader2, Search, Calendar, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { userService, type User, type CreateUserRequest } from '@/services/userService'
import { useUserRole } from '@/hooks/useUserRole'
import { getCreatableRoles, UserRole } from '@/lib/roles'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Zod schema for user creation form
const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.string().min(1, 'Role is required'),
  designation: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
})

type CreateUserFormData = z.infer<typeof createUserSchema>

export default function Team() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const { user, role, isClient, canManageUsers, teamId } = useUserRole()

  // Redirect only CLIENT (USER can view their own team)
  if (isClient) {
    navigate('/app/dashboard')
    return null
  }

  const creatableRoles = useMemo(() => getCreatableRoles(role), [role])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      role: creatableRoles[0] || '',
      designation: '',
      password: '',
    },
  })

  const roleValue = watch('role')

  // Fetch users
  const { data: users = [], isLoading, isError } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: userService.getUsers,
  })

  // Create user mutation
  const createMutation = useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Team member added successfully')
      setIsAddDialogOpen(false)
      reset()
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { status?: number; data?: { message?: string } }; message?: string }
      const message = axiosError.response?.data?.message || axiosError.message || 'Failed to add team member'
      toast.error(message)
    },
  })

  const onSubmit = (data: CreateUserFormData) => {
    const payload: CreateUserRequest = {
      name: data.name,
      email: data.email,
      role: data.role,
      designation: data.designation || undefined,
      teamId: teamId, // Assign to current user's team
    }
    if (data.password && data.password.trim()) {
      payload.password = data.password
    }
    createMutation.mutate(payload)
  }

  // Separate current user from team members
  const currentUserData = useMemo(() => {
    return users.find(u => u.id === user?.id)
  }, [users, user])

  const teamMembers = useMemo(() => {
    return users.filter(u => u.id !== user?.id)
  }, [users, user])

  // Filter team members (excluding current user)
  const filteredUsers = teamMembers.filter(
    (member) =>
      member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    try {
      return format(new Date(dateString), 'MMM dd, yyyy')
    } catch {
      return 'N/A'
    }
  }

  // Role counts (excluding current user)
  const roleCounts = useMemo(() => {
    return {
      total: teamMembers.length,
      topUser: teamMembers.filter(u => u.role === UserRole.TOP_USER).length,
      superUser: teamMembers.filter(u => u.role === UserRole.SUPER_USER).length,
      admin: teamMembers.filter(u => u.role === UserRole.ADMIN).length,
      user: teamMembers.filter(u => u.role === UserRole.USER).length,
    }
  }, [teamMembers])

  return (
    <ContentSection>
      <PageHeader
        title="Team"
        subtitle="Manage your team members and their roles"
        primaryAction={
          canManageUsers ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="w-5 h-5 mr-2" />
                    Add Member
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>You can create: {creatableRoles.join(', ')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Alert className="w-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You don't have permission to add team members
              </AlertDescription>
            </Alert>
          )
        }
      />

      {/* Current User Profile */}
      {currentUserData && (
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg shadow-sm border border-primary/20 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Your Profile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{currentUserData.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{currentUserData.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="font-medium">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                  {currentUserData.role}
                </span>
              </p>
            </div>
            {currentUserData.designation && (
              <div>
                <p className="text-sm text-muted-foreground">Designation</p>
                <p className="font-medium">{currentUserData.designation}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Joined</p>
              <p className="font-medium">{formatDate(currentUserData.createdAt)}</p>
            </div>
            {!currentUserData.teamId && (
              <div className="md:col-span-3">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You are not assigned to any team yet. Users you create will also not be assigned to a team.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Team stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        <div className="bg-card rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total Members</p>
              <p className="text-2xl font-bold">{isLoading ? '-' : roleCounts.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Admins</p>
              <p className="text-2xl font-bold">{isLoading ? '-' : roleCounts.admin}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Users</p>
              <p className="text-2xl font-bold">{isLoading ? '-' : roleCounts.user}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Super Users</p>
              <p className="text-2xl font-bold">{isLoading ? '-' : roleCounts.superUser}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="bg-card rounded-lg shadow-sm border p-4">
        <h3 className="text-sm font-semibold mb-3">Team Members</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Team list */}
      <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto text-destructive mb-4" />
            <p className="text-destructive">Failed to load team members</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'No team members found' : 'No team members yet'}
            </p>
            {canManageUsers && !searchQuery && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Member
              </Button>
            )}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Designation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filteredUsers.map((member) => (
                <tr key={member.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground text-sm font-medium">
                          {member.name?.substring(0, 2).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium">
                          {member.name || 'Unnamed User'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-muted-foreground flex items-center">
                      <Mail className="w-3 h-3 mr-1" />
                      {member.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary/10 text-primary">
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {member.designation || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                      {member.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(member.createdAt)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Member Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Create a new team member. You can create: {creatableRoles.join(', ')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" placeholder="John Doe" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" placeholder="john@company.com" {...register('email')} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={roleValue}
                  onValueChange={(value) => setValue('role', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {creatableRoles.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                <Input id="designation" placeholder="Software Engineer" {...register('designation')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password (optional)</Label>
                <Input id="password" type="password" placeholder="Min 8 characters" {...register('password')} />
                <p className="text-xs text-muted-foreground">Leave empty to generate random password</p>
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsAddDialogOpen(false); reset() }}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Member'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ContentSection>
  )
}
