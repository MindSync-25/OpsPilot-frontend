import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Users, Loader2, AlertCircle, Building2, Trash2, Edit, RefreshCw, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useOnboarding } from '@/contexts/OnboardingContext'
import OnboardingTooltip from '@/components/onboarding/OnboardingTooltip'
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
import { teamService, type Team, type CreateTeamRequest } from '@/services/teamService'
import { useUserRole } from '@/hooks/useUserRole'
import { getCreatableRoles, UserRole, canCreateTeam, canCreateUser } from '@/lib/roles'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import TeamsToolbar, { type TeamsToolbarFilters } from '@/components/teams/TeamsToolbar'
import ConfirmActionDialog from '@/components/teams/ConfirmActionDialog'
import { formatRelative, formatDate } from '@/lib/time'

// Zod schemas
const createTeamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters'),
  leadUserId: z.string().optional(),
})

const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.string().min(1, 'Role is required'),
  teamId: z.string().optional(),
  designation: z.string().optional(),
  hourlyRate: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
})

type CreateTeamFormData = z.infer<typeof createTeamSchema>
type CreateUserFormData = z.infer<typeof createUserSchema>

export default function TeamNew() {
  const { shouldShowOnboarding, completedSteps } = useOnboarding()
  const [isCreateTeamDialogOpen, setIsCreateTeamDialogOpen] = useState(false)
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false)
  const [isAssignMemberDialogOpen, setIsAssignMemberDialogOpen] = useState(false)
  const [isEditMemberDialogOpen, setIsEditMemberDialogOpen] = useState(false)
  const [isEditTeamDialogOpen, setIsEditTeamDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<User | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [selectedTeamForAssignment, setSelectedTeamForAssignment] = useState<string>('')
  
  // Confirmation dialogs
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    action: () => void
    variant?: 'default' | 'destructive'
  }>({
    open: false,
    title: '',
    description: '',
    action: () => {},
  })
  
  // Filters
  const [filters, setFilters] = useState<TeamsToolbarFilters>({
    search: '',
    roleFilter: 'all',
    teamFilter: 'all',
    statusFilter: 'all',
    sortBy: 'name-asc',
  })
  
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const { user, role, isClient } = useUserRole()

  if (isClient) {
    navigate('/app/dashboard')
    return null
  }

  const canCreateTeams = canCreateTeam(role)
  const canCreateUsers = canCreateUser(role)
  const canEditUsers = role === UserRole.TOP_USER || role === UserRole.SUPER_USER
  const canChangeRoles = role === UserRole.TOP_USER || role === UserRole.SUPER_USER
  const creatableRoles = useMemo(() => getCreatableRoles(role), [role])

  // Fetch teams
  const { data: teams = [], isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: teamService.getTeams,
  })

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: userService.getUsers,
  })

  // Create team form
  const teamForm = useForm<CreateTeamFormData>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: '',
      leadUserId: '',
    },
  })

  // Create user form
  const userForm = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      role: creatableRoles[0] || '',
      teamId: undefined,
      designation: '',
      hourlyRate: '',
      password: '',
    },
  })

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: teamService.createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Team created successfully')
      setIsCreateTeamDialogOpen(false)
      teamForm.reset()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create team')
    },
  })

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Team member added successfully')
      setIsAddMemberDialogOpen(false)
      userForm.reset()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add member')
    },
  })

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      userService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Team member updated successfully')
      setIsEditMemberDialogOpen(false)
      setSelectedMember(null)
      userForm.reset()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update member')
    },
  })

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: userService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Team member deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete member')
    },
  })

  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTeamRequest> }) => {
      console.log('updateTeamMutation mutationFn called with:', { id, data })
      return teamService.updateTeam(id, data)
    },
    onSuccess: () => {
      console.log('Team update successful')
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Team updated successfully')
      setIsEditTeamDialogOpen(false)
      setSelectedTeam(null)
      teamForm.reset()
    },
    onError: (error: any) => {
      console.error('Team update failed:', error)
      toast.error(error.response?.data?.message || 'Failed to update team')
    },
  })

  // Delete team mutation
  const deleteTeamMutation = useMutation({
    mutationFn: teamService.deleteTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      toast.success('Team deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete team')
    },
  })

  const onCreateTeam = (data: CreateTeamFormData) => {
    createTeamMutation.mutate(data)
  }

  const onAddMember = (data: CreateUserFormData) => {
    // SUPER_USER cannot be assigned to teams
    let teamIdToAssign: string | undefined
    if (data.role === UserRole.SUPER_USER) {
      teamIdToAssign = undefined
    } else if (role === UserRole.ADMIN && currentUser?.teamId) {
      // For ADMIN, automatically assign to their team
      teamIdToAssign = currentUser.teamId
    } else {
      teamIdToAssign = data.teamId
    }

    const payload: CreateUserRequest = {
      name: data.name,
      email: data.email,
      role: data.role,
      teamId: teamIdToAssign || undefined,
      designation: data.designation || undefined,
      hourlyRate: data.hourlyRate ? parseFloat(data.hourlyRate) : undefined,
    }
    if (data.password && data.password.trim()) {
      payload.password = data.password
    }
    createUserMutation.mutate(payload)
  }

  const onEditMember = (data: CreateUserFormData) => {
    if (!selectedMember) return
    
    const payload: Partial<User> = {
      name: data.name,
      email: data.email,
      role: data.role,
      // SUPER_USER cannot be assigned to teams
      teamId: data.role === UserRole.SUPER_USER ? undefined : data.teamId,
      designation: data.designation || undefined,
      hourlyRate: data.hourlyRate ? parseFloat(data.hourlyRate) : undefined,
    }
    updateUserMutation.mutate({ id: selectedMember.id, data: payload })
  }

  const onDeleteMember = (memberId: string, memberName: string) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Team Member',
      description: `Are you sure you want to delete "${memberName}"? This action cannot be undone.`,
      action: () => {
        deleteUserMutation.mutate(memberId)
        setConfirmDialog({ ...confirmDialog, open: false })
      },
      variant: 'destructive',
    })
  }

  const onEditTeam = (data: CreateTeamFormData) => {
    if (!selectedTeam) {
      console.error('No team selected for editing')
      return
    }
    console.log('Updating team:', selectedTeam.id, 'with data:', data)
    updateTeamMutation.mutate({ id: selectedTeam.id, data })
  }

  const onDeleteTeam = (teamId: string, teamName: string) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Team',
      description: `Are you sure you want to delete "${teamName}"? All members will become unassigned. This action cannot be undone.`,
      action: () => {
        deleteTeamMutation.mutate(teamId)
        setConfirmDialog({ ...confirmDialog, open: false })
      },
      variant: 'destructive',
    })
  }

  const onAssignMemberToTeam = (memberId: string, teamId: string, memberName: string, previousTeamId?: string | null) => {
    const member = users.find(u => u.id === memberId)
    if (!member) return
    
    // Build payload with explicit null for unassignment
    const payload: Partial<User> & { teamId: string | null } = {
      name: member.name,
      email: member.email,
      role: member.role,
      teamId: teamId === '' ? null : teamId,
      designation: member.designation,
    }
    console.log('Updating user with payload:', payload)
    
    // Save undo action before mutation
    const prevTeamId = previousTeamId !== undefined ? previousTeamId : member.teamId
    
    updateUserMutation.mutate(
      { id: memberId, data: payload },
      {
        onSuccess: () => {
          const teamName = teams.find(t => t.id === teamId)?.name
          
          toast.success(
            teamId === '' 
              ? `${memberName} unassigned from team`
              : `${memberName} moved to ${teamName}`,
            {
              duration: 8000,
              action: prevTeamId !== null ? {
                label: 'Undo',
                onClick: () => {
                  // Undo by reassigning to previous team
                  const undoPayload: Partial<User> & { teamId: string | null } = {
                    ...payload,
                    teamId: prevTeamId || null,
                  }
                  updateUserMutation.mutate(
                    { id: memberId, data: undoPayload },
                    {
                      onSuccess: () => {
                        toast.success('Action undone')
                      },
                    }
                  )
                },
              } : undefined,
            }
          )
        },
      }
    )
  }

  const onChangeRole = (memberId: string, newRole: string, memberName: string, currentRole: string) => {
    // Validation
    if (currentRole === UserRole.TOP_USER) {
      toast.error('Cannot change role of TOP_USER')
      return
    }
    
    if (role === UserRole.SUPER_USER && (newRole === UserRole.TOP_USER || newRole === UserRole.SUPER_USER)) {
      toast.error('SUPER_USER cannot assign TOP_USER or SUPER_USER roles')
      return
    }
    
    if (user?.id === memberId && newRole !== UserRole.TOP_USER) {
      toast.error('Cannot demote yourself')
      return
    }
    
    setConfirmDialog({
      open: true,
      title: 'Change User Role',
      description: `Change ${memberName}'s role from ${currentRole} to ${newRole}?`,
      action: () => {
        const member = users.find(u => u.id === memberId)
        if (!member) return
        
        const payload: Partial<User> = {
          name: member.name,
          email: member.email,
          role: newRole,
          teamId: newRole === UserRole.SUPER_USER ? null : member.teamId,
          designation: member.designation,
        }
        
        updateUserMutation.mutate(
          { id: memberId, data: payload },
          {
            onSuccess: () => {
              toast.success(
                `${memberName}'s role changed to ${newRole}`,
                {
                  duration: 8000,
                  action: {
                    label: 'Undo',
                    onClick: () => {
                      const undoPayload: Partial<User> = {
                        ...payload,
                        role: currentRole,
                        teamId: member.teamId,
                      }
                      updateUserMutation.mutate(
                        { id: memberId, data: undoPayload },
                        {
                          onSuccess: () => {
                            toast.success('Role change undone')
                          },
                        }
                      )
                    },
                  },
                }
              )
            },
            onError: () => {
              toast.error('Failed to change role. Backend endpoint may not be available.')
            },
          }
        )
        setConfirmDialog({ ...confirmDialog, open: false })
      },
    })
  }



  // Super users (separate section, cannot be assigned to teams)
  const superUsers = useMemo(() => {
    return users.filter(u => u.role === UserRole.SUPER_USER && u.id !== user?.id)
  }, [users, user])

  // Group users by team (excluding SUPER_USERs)
  const teamsWithMembers = useMemo(() => {
    return teams.map(team => ({
      ...team,
      members: users.filter(u => u.teamId === team.id && u.id !== user?.id && u.role !== UserRole.SUPER_USER),
    }))
  }, [teams, users, user])

  // Users without team (excluding current user and SUPER_USERs)
  const usersWithoutTeam = useMemo(() => {
    return users.filter(u => !u.teamId && u.id !== user?.id && u.role !== UserRole.SUPER_USER)
  }, [users, user])

  // Current user info
  const currentUser = useMemo(() => {
    if (!user?.id || usersLoading) return null
    return users.find(u => u.id === user.id) || null
  }, [users, user, usersLoading])

  // Apply filters and sorting
  const filteredAndSortedData = useMemo(() => {
    const searchLower = filters.search.toLowerCase()
    
    // Filter super users
    let filteredSuperUsers = superUsers
    if (filters.search) {
      filteredSuperUsers = filteredSuperUsers.filter(u =>
        u.name.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower)
      )
    }
    if (filters.roleFilter !== 'all' && filters.roleFilter !== UserRole.SUPER_USER) {
      filteredSuperUsers = []
    }
    if (filters.statusFilter !== 'all') {
      filteredSuperUsers = filteredSuperUsers.filter(u => 
        filters.statusFilter === 'active' ? (u.isActive !== false) : (u.isActive === false)
      )
    }
    
    // Filter teams and members
    let filteredTeams = teamsWithMembers.map(team => {
      let filteredMembers = team.members
      const teamNameMatches = !filters.search || team.name.toLowerCase().includes(searchLower)
      
      // Apply search
      if (filters.search) {
        filteredMembers = filteredMembers.filter(m =>
          m.name.toLowerCase().includes(searchLower) ||
          m.email.toLowerCase().includes(searchLower) ||
          team.name.toLowerCase().includes(searchLower)
        )
      }
      
      // Apply role filter
      if (filters.roleFilter !== 'all') {
        filteredMembers = filteredMembers.filter(m => m.role === filters.roleFilter)
      }
      
      // Apply status filter
      if (filters.statusFilter !== 'all') {
        filteredMembers = filteredMembers.filter(m => 
          filters.statusFilter === 'active' ? (m.isActive !== false) : (m.isActive === false)
        )
      }
      
      return { 
        ...team, 
        members: filteredMembers,
        _shouldShow: teamNameMatches || filteredMembers.length > 0
      }
    }).filter(team => team._shouldShow)
    
    // Apply team filter
    if (filters.teamFilter !== 'all' && filters.teamFilter !== 'unassigned') {
      filteredTeams = filteredTeams.filter(t => t.id === filters.teamFilter)
    }
    
    // Filter unassigned users
    let filteredUnassigned = usersWithoutTeam
    if (filters.search) {
      filteredUnassigned = filteredUnassigned.filter(u =>
        u.name.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower)
      )
    }
    if (filters.roleFilter !== 'all') {
      filteredUnassigned = filteredUnassigned.filter(u => u.role === filters.roleFilter)
    }
    if (filters.statusFilter !== 'all') {
      filteredUnassigned = filteredUnassigned.filter(u => 
        filters.statusFilter === 'active' ? (u.isActive !== false) : (u.isActive === false)
      )
    }
    if (filters.teamFilter === 'unassigned') {
      // Show only unassigned
    } else if (filters.teamFilter !== 'all') {
      filteredUnassigned = []
    }
    
    // Sort teams
    if (filters.sortBy === 'name-asc') {
      filteredTeams.sort((a, b) => a.name.localeCompare(b.name))
    } else if (filters.sortBy === 'members-desc') {
      filteredTeams.sort((a, b) => b.members.length - a.members.length)
    } else if (filters.sortBy === 'updated-desc') {
      filteredTeams.sort((a, b) => {
        const aDate = new Date(a.updatedAt || a.createdAt || 0).getTime()
        const bDate = new Date(b.updatedAt || b.createdAt || 0).getTime()
        return bDate - aDate
      })
    }
    
    return {
      superUsers: filteredSuperUsers,
      teams: filteredTeams,
      unassigned: filteredUnassigned,
    }
  }, [superUsers, teamsWithMembers, usersWithoutTeam, filters])

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case UserRole.TOP_USER:
        return 'bg-[var(--accent-primary-soft)] text-[var(--accent-primary)]'
      case UserRole.SUPER_USER:
        return 'bg-[var(--accent-primary-soft)] text-[var(--accent-primary)]'
      case UserRole.ADMIN:
        return 'bg-[var(--accent-success)]/10 text-[var(--accent-success)]'
      case UserRole.USER:
        return 'bg-muted text-muted-foreground'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <ContentSection>
      <PageHeader
        title="Teams & Members"
        subtitle="Manage teams and their members"
        primaryAction={
          <div className="flex gap-2">
            {canCreateUsers && (
              <div className="relative">
                <Button variant="outline" onClick={() => setIsAddMemberDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Member
                </Button>
                {shouldShowOnboarding && !completedSteps.includes('team') && (
                  <OnboardingTooltip
                    stepId="team-create"
                    title="Add Your First Team Member"
                    description="Click here to invite team members and start collaborating. You can assign roles and manage their permissions."
                    position="bottom"
                  />
                )}
              </div>
            )}
            {canCreateTeams && (
              <Button onClick={() => setIsCreateTeamDialogOpen(true)}>
                <Building2 className="w-4 h-4 mr-2" />
                Create Team
              </Button>
            )}
          </div>
        }
      />

      {/* Search and Filters Toolbar */}
      <TeamsToolbar
        filters={filters}
        onFiltersChange={setFilters}
        teamNames={teams.map(t => ({ id: t.id, name: t.name }))}
        allUsers={users}
        allTeams={teams}
      />

      {currentUser && (
      <div className="bg-gradient-to-r from-[var(--accent-primary-weak)] to-[var(--accent-primary-weak)] rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-[var(--accent-primary)]/20 p-4 mb-6">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Your Profile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{currentUser.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{currentUser.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(currentUser.role)}`}>
                {currentUser.role}
              </span>
            </div>
            {currentUser.designation && (
              <div>
                <p className="text-sm text-muted-foreground">Designation</p>
                <p className="font-medium">{currentUser.designation}</p>
              </div>
            )}
          </div>
          {!currentUser.teamId && currentUser.role !== UserRole.TOP_USER && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You are not assigned to any team. Create a team or ask an administrator to assign you to one.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Super Users Section - Only visible to TOP_USER */}
      {role === UserRole.TOP_USER && !usersLoading && filteredAndSortedData.superUsers.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-[var(--accent-primary)]">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Super Users
              </div>
              <span className="text-sm font-normal text-muted-foreground">
                {filteredAndSortedData.superUsers.length} member{filteredAndSortedData.superUsers.length !== 1 ? 's' : ''}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredAndSortedData.superUsers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--accent-primary-weak)] flex items-center justify-center">
                        <span className="text-sm font-medium text-[var(--accent-primary)]">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                        {member.designation && (
                          <p className="text-xs text-muted-foreground">{member.designation}</p>
                        )}
                        {/* Audit Trail */}
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>Joined {formatDate(member.createdAt)}</span>
                          {member.updatedAt && member.updatedAt !== member.createdAt && (
                            <span>• Updated {formatRelative(member.updatedAt)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                      {member.role}
                    </span>
                    {canChangeRoles && member.role !== UserRole.TOP_USER && (
                      <Select
                        value={member.role}
                        onValueChange={(newRole) => onChangeRole(member.id, newRole, member.name, member.role)}
                      >
                        <SelectTrigger className="w-[120px] h-8 text-xs">
                          <RefreshCw className="w-3 h-3 mr-1" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {creatableRoles.map((creatableRole) => (
                            <SelectItem key={creatableRole} value={creatableRole}>
                              {creatableRole}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {canEditUsers && (
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMember(member)
                            userForm.setValue('name', member.name)
                            userForm.setValue('email', member.email)
                            userForm.setValue('role', member.role)
                            userForm.setValue('teamId', member.teamId || 'none')
                            userForm.setValue('designation', member.designation || '')
                            userForm.setValue('hourlyRate', member.hourlyRate?.toString() || '')
                            setIsEditMemberDialogOpen(true)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteMember(member.id, member.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teams List */}
      {teamsLoading || usersLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {teams.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No teams yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {canCreateTeams
                    ? 'Create your first team to get started'
                    : 'Ask an administrator to create a team'}
                </p>
                {canCreateTeams && (
                  <Button onClick={() => setIsCreateTeamDialogOpen(true)}>
                    <Building2 className="w-4 h-4 mr-2" />
                    Create Team
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {filteredAndSortedData.teams.map((team) => (
            <Card key={team.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    {team.name}
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                    </span>
                  </CardTitle>
                  {/* Team Audit Trail */}
                  {(team.updatedAt || team.createdAt) && (
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>
                        Updated {formatRelative(team.updatedAt || team.createdAt)}
                        {/* Optionally show updatedBy if available */}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {canCreateTeams && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTeam(team)
                          teamForm.setValue('name', team.name)
                          teamForm.setValue('leadUserId', team.leadUserId || undefined)
                          setIsEditTeamDialogOpen(true)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteTeam(team.id, team.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  {filteredAndSortedData.unassigned.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTeamForAssignment(team.id)
                        setIsAssignMemberDialogOpen(true)
                      }}
                    >
                      <Users className="w-4 h-4 mr-1" />
                      Assign Member
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {team.members.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No members in this team yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {team.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[var(--accent-primary-weak)] flex items-center justify-center">
                              <span className="text-sm font-medium">
                                {member.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{member.name}</p>
                              <p className="text-sm text-muted-foreground">{member.email}</p>
                              {member.designation && (
                                <p className="text-xs text-muted-foreground">{member.designation}</p>
                              )}
                              {/* Audit Trail */}
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>Joined {formatDate(member.createdAt)}</span>
                                {member.updatedAt && member.updatedAt !== member.createdAt && (
                                  <span>• Updated {formatRelative(member.updatedAt)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                            {member.role}
                          </span>
                          {canChangeRoles && member.role !== UserRole.TOP_USER && (
                            <Select
                              value={member.role}
                              onValueChange={(newRole) => onChangeRole(member.id, newRole, member.name, member.role)}
                            >
                              <SelectTrigger className="w-[120px] h-8 text-xs">
                                <RefreshCw className="w-3 h-3 mr-1" />
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {role === UserRole.TOP_USER && (
                                  <>
                                    <SelectItem value={UserRole.SUPER_USER}>SUPER_USER</SelectItem>
                                    <SelectItem value={UserRole.ADMIN}>ADMIN</SelectItem>
                                    <SelectItem value={UserRole.USER}>USER</SelectItem>
                                  </>
                                )}
                                {role === UserRole.SUPER_USER && (
                                  <>
                                    <SelectItem value={UserRole.ADMIN}>ADMIN</SelectItem>
                                    <SelectItem value={UserRole.USER}>USER</SelectItem>
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                          )}
                          {canEditUsers && (
                            <div className="flex items-center gap-2 ml-2">
                              {/* Change Team Dropdown */}
                              <Select
                                value={member.teamId || 'none'}
                                onValueChange={(value) => {
                                  if (value === 'unassign') {
                                    onAssignMemberToTeam(member.id, '', member.name, member.teamId)
                                  } else {
                                    onAssignMemberToTeam(member.id, value, member.name, member.teamId)
                                  }
                                }}
                              >
                                <SelectTrigger className="w-[160px] h-8 text-xs">
                                  <Building2 className="w-3 h-3 mr-1" />
                                  <SelectValue placeholder="Move to team" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unassign">✕ Unassign from team</SelectItem>
                                  {teams.filter(t => t.id !== member.teamId).map((team) => (
                                    <SelectItem key={team.id} value={team.id}>
                                      → {team.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedMember(member)
                                    userForm.setValue('name', member.name)
                                    userForm.setValue('email', member.email)
                                    userForm.setValue('role', member.role)
                                    userForm.setValue('teamId', member.teamId || 'none')
                                    userForm.setValue('designation', member.designation || '')
                                    setIsEditMemberDialogOpen(true)
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onDeleteMember(member.id, member.name)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
            </>
          )}

          {/* Users without team - Always show if there are any */}
          {filteredAndSortedData.unassigned.length > 0 && (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Unassigned Members
                  </div>
                  <span className="text-sm font-normal">
                    {filteredAndSortedData.unassigned.length} member{filteredAndSortedData.unassigned.length !== 1 ? 's' : ''}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredAndSortedData.unassigned.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                            {member.designation && (
                              <p className="text-xs text-muted-foreground">{member.designation}</p>
                            )}
                            {/* Audit Trail */}
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>Joined {formatDate(member.createdAt)}</span>
                              {member.updatedAt && member.updatedAt !== member.createdAt && (
                                <span>• Updated {formatRelative(member.updatedAt)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                          {member.role}
                        </span>
                        {canChangeRoles && member.role !== UserRole.TOP_USER && (
                          <Select
                            value={member.role}
                            onValueChange={(newRole) => onChangeRole(member.id, newRole, member.name, member.role)}
                          >
                            <SelectTrigger className="w-[120px] h-8 text-xs">
                              <RefreshCw className="w-3 h-3 mr-1" />
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {role === UserRole.TOP_USER && (
                                <>
                                  <SelectItem value={UserRole.SUPER_USER}>SUPER_USER</SelectItem>
                                  <SelectItem value={UserRole.ADMIN}>ADMIN</SelectItem>
                                  <SelectItem value={UserRole.USER}>USER</SelectItem>
                                </>
                              )}
                              {role === UserRole.SUPER_USER && (
                                <>
                                  <SelectItem value={UserRole.ADMIN}>ADMIN</SelectItem>
                                  <SelectItem value={UserRole.USER}>USER</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        )}
                        {canEditUsers && (
                          <>
                            <Select
                              value="none"
                              onValueChange={(teamId) => onAssignMemberToTeam(member.id, teamId, member.name, null)}
                            >
                              <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Assign to team" />
                              </SelectTrigger>
                              <SelectContent>
                                {teams.map((team) => (
                                  <SelectItem key={team.id} value={team.id}>
                                    {team.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <div className="flex gap-1 ml-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedMember(member)
                                  userForm.setValue('name', member.name)
                                  userForm.setValue('email', member.email)
                                  userForm.setValue('role', member.role)
                                  userForm.setValue('teamId', member.teamId || 'none')
                                  userForm.setValue('designation', member.designation || '')
                                  userForm.setValue('hourlyRate', member.hourlyRate?.toString() || '')
                                  userForm.setValue('hourlyRate', member.hourlyRate?.toString() || '')
                                  setIsEditMemberDialogOpen(true)
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteMember(member.id, member.name)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Create Team Dialog */}
      <Dialog open={isCreateTeamDialogOpen} onOpenChange={setIsCreateTeamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Create a new team to organize your members
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={teamForm.handleSubmit(onCreateTeam)}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  placeholder="Engineering, Sales, Support..."
                  {...teamForm.register('name')}
                />
                {teamForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {teamForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="leadUserId">Team Lead (Optional)</Label>
                <Select
                  value={teamForm.watch('leadUserId') || 'none'}
                  onValueChange={(value) => teamForm.setValue('leadUserId', value === 'none' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team lead" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No lead</SelectItem>
                    {users.filter(u => !u.teamId).map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateTeamDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createTeamMutation.isPending}>
                {createTeamMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Create Team
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={isEditTeamDialogOpen} onOpenChange={setIsEditTeamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>
              Update team details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={teamForm.handleSubmit(onEditTeam)}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editTeamName">Team Name</Label>
                <Input
                  id="editTeamName"
                  placeholder="Engineering, Sales, Support..."
                  {...teamForm.register('name')}
                />
                {teamForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {teamForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="editLeadUserId">Team Lead (Optional)</Label>
                <Select
                  value={teamForm.watch('leadUserId') || 'none'}
                  onValueChange={(value) => teamForm.setValue('leadUserId', value === 'none' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team lead" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No lead</SelectItem>
                    {users.filter(u => !u.teamId || u.teamId === selectedTeam?.id).map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditTeamDialogOpen(false)
                  setSelectedTeam(null)
                  teamForm.reset()
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateTeamMutation.isPending}>
                {updateTeamMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Update Team
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Member</DialogTitle>
            <DialogDescription>
              Create a new team member (will be unassigned initially)
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={userForm.handleSubmit(onAddMember)}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...userForm.register('name')} />
                {userForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {userForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...userForm.register('email')} />
                {userForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {userForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={userForm.watch('role')}
                  onValueChange={(value) => userForm.setValue('role', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {creatableRoles.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {userForm.formState.errors.role && (
                  <p className="text-sm text-destructive">
                    {userForm.formState.errors.role.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="team">Team (Optional)</Label>
                {userForm.watch('role') === UserRole.SUPER_USER ? (
                  // SUPER_USER cannot be assigned to teams
                  <div className="flex items-center gap-2 p-2 border rounded-md bg-muted text-muted-foreground">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">Super users cannot be assigned to teams</span>
                  </div>
                ) : role === UserRole.ADMIN ? (
                  // ADMIN can only see and select their own team
                  currentUser?.teamId ? (
                    <Select value={currentUser.teamId} disabled>
                      <SelectTrigger id="team">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={currentUser.teamId}>
                          {teams.find(t => t.id === currentUser.teamId)?.name || 'Your Team'}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2 p-2 border rounded-md bg-muted text-muted-foreground">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">No team available</span>
                    </div>
                  )
                ) : (
                  // TOP_USER can select from all teams (not for SUPER_USER creation)
                  <Select value={userForm.watch('teamId') || 'none'} onValueChange={(value) => userForm.setValue('teamId', value === 'none' ? undefined : value)}>
                    <SelectTrigger id="team">
                      <SelectValue placeholder="Select team (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No team (unassigned)</SelectItem>
                      {teams.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No teams available
                        </div>
                      ) : (
                        teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="designation">Designation (Optional)</Label>
                <Input
                  id="designation"
                  placeholder="e.g., Senior Developer"
                  {...userForm.register('designation')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Hourly Rate ($/hour - Optional)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g., 75.00"
                  {...userForm.register('hourlyRate')}
                />
                <p className="text-xs text-muted-foreground">
                  Billing rate for time entries when generating invoices
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password (Optional)</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Leave empty for auto-generated"
                  {...userForm.register('password')}
                />
                {userForm.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {userForm.formState.errors.password.message}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddMemberDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createUserMutation.isPending}>
                {createUserMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Create Member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Existing Member Dialog */}
      <Dialog open={isAssignMemberDialogOpen} onOpenChange={setIsAssignMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Existing Member</DialogTitle>
            <DialogDescription>
              Select an unassigned member to add to this team
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {usersWithoutTeam.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No unassigned members available
              </p>
            ) : (
              <div className="space-y-2">
                {usersWithoutTeam.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => {
                      onAssignMemberToTeam(member.id, selectedTeamForAssignment, member.name, null)
                      setIsAssignMemberDialogOpen(false)
                      setSelectedTeamForAssignment('')
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAssignMemberDialogOpen(false)
                setSelectedTeamForAssignment('')
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={isEditMemberDialogOpen} onOpenChange={setIsEditMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>
              Update member details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={userForm.handleSubmit(onEditMember)}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Name</Label>
                <Input id="editName" {...userForm.register('name')} />
                {userForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {userForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="editEmail">Email</Label>
                <Input id="editEmail" type="email" {...userForm.register('email')} />
                {userForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {userForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="editRole">Role</Label>
                <Select
                  value={userForm.watch('role')}
                  onValueChange={(value) => userForm.setValue('role', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {creatableRoles.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {userForm.formState.errors.role && (
                  <p className="text-sm text-destructive">
                    {userForm.formState.errors.role.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="editTeam">Team</Label>
                {userForm.watch('role') === UserRole.SUPER_USER ? (
                  // SUPER_USER cannot be assigned to teams
                  <div className="flex items-center gap-2 p-2 border rounded-md bg-muted text-muted-foreground">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">Super users cannot be assigned to teams</span>
                  </div>
                ) : (
                  <Select
                    value={userForm.watch('teamId') || 'none'}
                    onValueChange={(value) => userForm.setValue('teamId', value === 'none' ? undefined : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No team (unassigned)</SelectItem>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {userForm.formState.errors.teamId && (
                  <p className="text-sm text-destructive">
                    {userForm.formState.errors.teamId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="editDesignation">Designation (Optional)</Label>
                <Input
                  id="editDesignation"
                  placeholder="e.g., Senior Developer"
                  {...userForm.register('designation')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editHourlyRate">Hourly Rate ($/hour - Optional)</Label>
                <Input
                  id="editHourlyRate"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g., 75.00"
                  {...userForm.register('hourlyRate')}
                />
                <p className="text-xs text-muted-foreground">
                  Billing rate for time entries when generating invoices
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditMemberDialogOpen(false)
                  setSelectedMember(null)
                  userForm.reset()
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Update Member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmActionDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.variant === 'destructive' ? 'Delete' : 'Confirm'}
        onConfirm={confirmDialog.action}
        variant={confirmDialog.variant}
      />
    </ContentSection>
  )
}
