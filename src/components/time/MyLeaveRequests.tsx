import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Calendar, Loader2, XCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { getMyLeaveRequests, updateLeaveStatus } from '@/services/leaveService'
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

export default function MyLeaveRequests() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null)

  const { data: leaveRequests = [], isLoading } = useQuery({
    queryKey: ['myLeaveRequests'],
    queryFn: getMyLeaveRequests,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => updateLeaveStatus(id, 'CANCELLED'),
    onSuccess: () => {
      toast.success('Leave request cancelled')
      queryClient.invalidateQueries({ queryKey: ['myLeaveRequests'] })
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to cancel leave request')
    },
  })

  const handleCancelRequest = (id: string) => {
    setSelectedRequest(id)
    setCancelDialogOpen(true)
  }

  const confirmCancel = () => {
    if (!selectedRequest) return
    cancelMutation.mutate(selectedRequest)
    setCancelDialogOpen(false)
    setSelectedRequest(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">My Leave Requests</h3>
          <p className="text-sm text-muted-foreground">Manage your time off and absence</p>
        </div>
        <Button onClick={() => navigate('/app/time/leave/request')}>
          <Plus className="w-4 h-4 mr-2" />
          Request Leave
        </Button>
      </div>

      {/* Leave Requests Table */}
      <Card>
        <div className="p-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : leaveRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No leave requests</p>
              <p className="text-sm">Click "Request Leave" to create your first request</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dates</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelRequest(request.id)}
                          disabled={cancelMutation.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      )}
                      {request.status === 'REJECTED' && request.rejectionReason && (
                        <p className="text-sm text-red-600 dark:text-red-400 max-w-xs truncate" title={request.rejectionReason}>
                          Reason: {request.rejectionReason}
                        </p>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Leave Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this leave request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              No, Keep It
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Yes, Cancel Request
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
