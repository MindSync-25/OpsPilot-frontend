import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Info, RefreshCw, UserCircle } from 'lucide-react'
import { projectMemberService } from '@/services/projectMemberService'
import { projectService } from '@/services/projectService'
import { userService } from '@/services/userService'
import { useUserRole } from '@/hooks/useUserRole'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface ProjectTeamViewProps {
  projectId: string
}

export function ProjectTeamView({ projectId }: ProjectTeamViewProps) {
  const { isClient } = useUserRole()
  const queryClient = useQueryClient()

  // Fetch project details to get project owner
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectService.getProject(projectId),
    enabled: !!projectId,
  })

  // Fetch all users to get project owner details
  const { data: users = [] } = useQuery({
    queryKey: ['users-for-assignment'],
    queryFn: () => userService.getUsersForAssignment(),
  })

  // Fetch project members
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['projectMembers', projectId],
    queryFn: () => projectMemberService.getProjectMembers(projectId),
    enabled: !!projectId,
  })

  // Get project owner details
  const projectOwner = users.find(u => u.id === project?.projectOwnerId)
  
  // Debug logging
  console.log('ProjectTeamView Debug:', {
    projectId,
    project,
    projectOwnerId: project?.projectOwnerId,
    users,
    projectOwner
  })
  
  // Sync members from tasks mutation
  const syncMutation = useMutation({
    mutationFn: () => projectMemberService.syncMembersFromTasks(projectId),
    onSuccess: (message) => {
      queryClient.invalidateQueries({ queryKey: ['projectMembers', projectId] })
      toast.success(message)
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to sync members')
    },
  })

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'TOP_USER':
      case 'SUPER_USER':
        return 'bg-[var(--accent-primary)]'
      case 'ADMIN':
        return 'bg-[var(--accent-primary)]'
      case 'USER':
        return 'bg-[var(--accent-success)]'
      case 'CLIENT':
        return 'bg-muted'
      default:
        return 'bg-muted'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Team members are automatically added when tasks are assigned to them in this project.
        </AlertDescription>
      </Alert>

      {/* Summary Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Project Team Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Total Members */}
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Members</p>
                <p className="text-xl font-bold">{members.length}</p>
              </div>
            </div>

            {/* Project Owner */}
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
              <div className="p-2 bg-[var(--accent-primary-weak)] rounded-lg">
                <UserCircle className="h-5 w-5 text-[var(--accent-primary)]" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Project Owner</p>
                {projectOwner ? (
                  <div>
                    <p className="text-base font-semibold">{projectOwner.name}</p>
                    <p className="text-xs text-muted-foreground">{projectOwner.email}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not assigned</p>
                )}
              </div>
            </div>
          </div>

          {/* Sync Button */}
          {!isClient && (
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                Sync from Tasks
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Members List */}
      {members.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No team members yet</h3>
              <p className="text-muted-foreground max-w-md">
                Team members will appear here automatically when tasks are assigned to them.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  {!isClient && <TableHead>Email</TableHead>}
                  <TableHead>Designation</TableHead>
                  {!isClient && <TableHead>Company Role</TableHead>}
                  <TableHead>Project Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                            {getInitials(member.userName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{member.userName}</div>
                      </div>
                    </TableCell>
                    {!isClient && (
                      <TableCell className="text-muted-foreground">{member.userEmail}</TableCell>
                    )}
                    <TableCell className="text-muted-foreground">
                      {member.userDesignation || '-'}
                    </TableCell>
                    {!isClient && (
                      <TableCell>
                        <Badge className={getRoleBadgeColor(member.userRole)}>
                          {member.userRole.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell>
                      {member.roleInProject ? (
                        <Badge variant="outline">{member.roleInProject}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
