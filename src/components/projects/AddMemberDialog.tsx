import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { projectMemberService } from '@/services/projectMemberService'
import { userService } from '@/services/userService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AddMemberDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddMemberDialog({ projectId, open, onOpenChange }: AddMemberDialogProps) {
  const queryClient = useQueryClient()
  const [selectedUserId, setSelectedUserId] = useState('')
  const [projectRole, setProjectRole] = useState('')

  // Fetch all users (excluding CLIENT and SUPER_USER for assignments)
  const { data: users = [] } = useQuery({
    queryKey: ['users-for-assignment'],
    queryFn: () => userService.getUsersForAssignment(),
  })

  // Fetch current project members to exclude them from selection
  const { data: currentMembers = [] } = useQuery({
    queryKey: ['projectMembers', projectId],
    queryFn: () => projectMemberService.getProjectMembers(projectId),
    enabled: open,
  })

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: () =>
      projectMemberService.addProjectMember(projectId, {
        userId: selectedUserId,
        roleInProject: projectRole || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectMembers', projectId] })
      toast.success('Member added successfully')
      handleClose()
    },
    onError: (error: any) => {
      toast.error('Failed to add member', {
        description: error.response?.data?.message || 'Please try again',
      })
    },
  })

  const handleClose = () => {
    setSelectedUserId('')
    setProjectRole('')
    onOpenChange(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId) {
      toast.error('Please select a user')
      return
    }
    addMemberMutation.mutate()
  }

  // Filter out users who are already members
  const availableUsers = users.filter(
    user => !currentMembers.some(member => member.userId === user.id)
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a team member to this project. You can assign an optional project-specific role.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user">Select User *</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="user">
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No available users to add
                    </div>
                  ) : (
                    availableUsers.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} - {user.designation || user.role}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectRole">Project Role (Optional)</Label>
              <Input
                id="projectRole"
                placeholder="e.g., Frontend Developer, Project Lead"
                value={projectRole}
                onChange={(e) => setProjectRole(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Specify a role for this member within this project
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedUserId || addMemberMutation.isPending}
            >
              {addMemberMutation.isPending ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
