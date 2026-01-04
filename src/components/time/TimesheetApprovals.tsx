import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2, Search, Filter, Eye } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { listTimesheets, reviewTimesheet, type TimesheetResponse } from '@/services/timesheetService'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface TimesheetApprovalsProps {
  role: UserRole
}

export default function TimesheetApprovals({ }: TimesheetApprovalsProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('SUBMITTED')
  const [userSearch, setUserSearch] = useState('')
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [selectedTimesheet, setSelectedTimesheet] = useState<TimesheetResponse | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const { data: timesheets = [], isLoading } = useQuery({
    queryKey: ['timesheets', statusFilter],
    queryFn: () => listTimesheets({ status: statusFilter === 'ALL' ? undefined : statusFilter }),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data stale to ensure fresh fetches
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => reviewTimesheet(id, 'APPROVED'),
    onSuccess: () => {
      toast.success('Timesheet approved')
      queryClient.invalidateQueries({ queryKey: ['timesheets'] })
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to approve timesheet')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => 
      reviewTimesheet(id, 'REJECTED', reason),
    onSuccess: () => {
      toast.success('Timesheet rejected')
      queryClient.invalidateQueries({ queryKey: ['timesheets'] })
      setRejectDialogOpen(false)
      setRejectionReason('')
      setSelectedTimesheet(null)
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to reject timesheet')
    },
  })

  const handleApprove = (timesheet: TimesheetResponse) => {
    setSelectedTimesheet(timesheet)
    setApproveDialogOpen(true)
  }

  const confirmApprove = () => {
    if (!selectedTimesheet) return
    approveMutation.mutate(selectedTimesheet.id)
    setApproveDialogOpen(false)
    setSelectedTimesheet(null)
  }

  const handleReject = (timesheet: TimesheetResponse) => {
    setSelectedTimesheet(timesheet)
    setRejectDialogOpen(true)
  }

  const confirmReject = () => {
    if (!selectedTimesheet || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    rejectMutation.mutate({ id: selectedTimesheet.id, reason: rejectionReason })
  }

  const filteredTimesheets = timesheets.filter(ts => {
    if (!userSearch) return true
    return ts.userId.toLowerCase().includes(userSearch.toLowerCase())
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
                placeholder="Search by user ID..."
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
                <SelectItem value="SUBMITTED">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="ALL">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Timesheets Table */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Team Timesheets</h3>
          
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : filteredTimesheets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No timesheets found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Week Start</TableHead>
                  <TableHead className="text-right">Total Hours</TableHead>
                  <TableHead className="text-right">Billable</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTimesheets.map((timesheet) => (
                  <TableRow 
                    key={timesheet.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/app/time/timesheets/${timesheet.id}`)}
                  >
                    <TableCell className="font-medium">
                      {timesheet.userName || `${timesheet.userId.substring(0, 8)}...`}
                    </TableCell>
                    <TableCell>{formatDate(timesheet.weekStart)}</TableCell>
                    <TableCell className="text-right">
                      {formatMinutesToHours(timesheet.totalMinutes)}
                    </TableCell>
                    <TableCell className="text-right text-[var(--accent-success)]">
                      {formatMinutesToHours(timesheet.billableMinutes)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={timesheet.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/app/time/timesheets/${timesheet.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        {timesheet.status === 'SUBMITTED' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(timesheet)}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(timesheet)}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      {/* Approve Confirmation Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Timesheet</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this timesheet? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedTimesheet && (
            <div className="py-4 space-y-2">
              <p><strong>User:</strong> {selectedTimesheet.userId.substring(0, 8)}...</p>
              <p><strong>Week:</strong> {formatDate(selectedTimesheet.weekStart)}</p>
              <p><strong>Total Hours:</strong> {formatMinutesToHours(selectedTimesheet.totalMinutes)}</p>
              <p><strong>Billable:</strong> {formatMinutesToHours(selectedTimesheet.billableMinutes)}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmApprove}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Approve Timesheet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Timesheet</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this timesheet. The user will see this message.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="e.g., Hours don't match logged time entries, missing project details..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
            >
              {rejectMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reject Timesheet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    SUBMITTED: 'bg-[var(--accent-primary-weak)] text-[var(--accent-primary)]',
    APPROVED: 'bg-[var(--accent-success)]/10 text-[var(--accent-success)]',
    REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }

  return (
    <Badge className={variants[status] || variants.DRAFT}>
      {status}
    </Badge>
  )
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function formatMinutesToHours(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}
