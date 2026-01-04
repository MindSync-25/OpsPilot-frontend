import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, Loader2, Search, Filter } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { listLeaveRequests, updateLeaveStatus, type LeaveResponse } from '@/services/leaveService'
import { UserRole } from '@/lib/roles'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface LeaveApprovalsProps {
  role: UserRole
}

export default function LeaveApprovals({ }: LeaveApprovalsProps) {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('PENDING')
  const [userSearch, setUserSearch] = useState('')
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<LeaveResponse | null>(null)
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED'>('APPROVED')
  const [decisionNote, setDecisionNote] = useState('')

  const { data: leaveRequests = [], isLoading } = useQuery({
    queryKey: ['teamLeaveRequests', statusFilter],
    queryFn: () => listLeaveRequests({ status: statusFilter === 'ALL' ? undefined : statusFilter }),    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,  })

  const actionMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: 'APPROVED' | 'REJECTED'; note?: string }) =>
      updateLeaveStatus(id, status, note),
    onSuccess: (_: LeaveResponse, variables: { id: string; status: 'APPROVED' | 'REJECTED'; note?: string }) => {
      toast.success(`Leave request ${variables.status.toLowerCase()}`)
      queryClient.invalidateQueries({ queryKey: ['teamLeaveRequests'] })
      setActionDialogOpen(false)
      setDecisionNote('')
      setSelectedRequest(null)
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to update leave request')
    },
  })

  const handleAction = (request: LeaveResponse, type: 'APPROVED' | 'REJECTED') => {
    setSelectedRequest(request)
    setActionType(type)
    setActionDialogOpen(true)
  }

  const confirmAction = () => {
    if (!selectedRequest) return
    
    if (actionType === 'REJECTED' && !decisionNote.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }
    
    actionMutation.mutate({
      id: selectedRequest.id,
      status: actionType,
      note: decisionNote || undefined,
    })
  }

  const filteredRequests = leaveRequests.filter((req: LeaveResponse) => {
    if (!userSearch) return true
    return req.userId.toLowerCase().includes(userSearch.toLowerCase()) ||
           req.userName?.toLowerCase().includes(userSearch.toLowerCase())
  })

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by user name or ID..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="w-full sm:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="ALL">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Leave Requests Table */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Team Leave Requests</h3>
          
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No leave requests found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request: LeaveResponse) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.userName || `${request.userId.substring(0, 8)}...`}
                    </TableCell>
                    <TableCell>
                      {formatDateRange(request.startDate, request.endDate)}
                    </TableCell>
                    <TableCell>
                      <LeaveTypeBadge type={request.type} />
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {request.reason || '-'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={request.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {request.status === 'PENDING' && (
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(request, 'APPROVED')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(request, 'REJECTED')}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'APPROVED' ? 'Approve' : 'Reject'} Leave Request
            </DialogTitle>
            <DialogDescription>
              {actionType === 'APPROVED' 
                ? 'Confirm approval for this leave request. You can add an optional note.'
                : 'Please provide a reason for rejecting this leave request.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="decisionNote">
              {actionType === 'APPROVED' ? 'Note (Optional)' : 'Rejection Reason *'}
            </Label>
            <Textarea
              id="decisionNote"
              placeholder={actionType === 'APPROVED' 
                ? 'Optional note for the employee...'
                : 'e.g., Insufficient leave balance, team coverage needed...'}
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'APPROVED' ? 'default' : 'destructive'}
              onClick={confirmAction}
              disabled={actionMutation.isPending || (actionType === 'REJECTED' && !decisionNote.trim())}
            >
              {actionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {actionType === 'APPROVED' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    APPROVED: 'bg-[var(--accent-success)]/10 text-[var(--accent-success)]',
    REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  }

  return (
    <Badge className={variants[status] || variants.PENDING}>
      {status}
    </Badge>
  )
}

function LeaveTypeBadge({ type }: { type: string }) {
  const variants: Record<string, string> = {
    PTO: 'bg-[var(--accent-primary-weak)] text-[var(--accent-primary)]',
    SICK: 'bg-[var(--accent-warning)]/10 text-[var(--accent-warning)]',
    HOLIDAY: 'bg-[var(--accent-primary-soft)] text-[var(--accent-primary)]',
    UNPAID: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  }

  return (
    <Badge className={variants[type] || variants.PTO}>
      {type}
    </Badge>
  )
}

function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)
  
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
  
  if (start === end) {
    return startDate.toLocaleDateString('en-US', options)
  }
  
  return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`
}
