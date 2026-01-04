import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import React from 'react'
import { ChevronLeft, Clock, DollarSign, FileText, Calendar, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import ContentSection from '@/components/common/ContentSection'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
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
import { getTimesheetById, reviewTimesheet, type TimesheetResponse } from '@/services/timesheetService'
import { getTimeEntries, type TimeEntry } from '@/services/timeEntryService'

export default function TimesheetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [approveDialogOpen, setApproveDialogOpen] = React.useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false)
  const [rejectionReason, setRejectionReason] = React.useState('')

  const { data: timesheet, isLoading: timesheetLoading } = useQuery<TimesheetResponse>({
    queryKey: ['timesheet', id],
    queryFn: () => getTimesheetById(id!),
    enabled: !!id,
  })

  const { data: timeEntries = [], isLoading: entriesLoading } = useQuery<TimeEntry[]>({
    queryKey: ['timeEntries', timesheet?.userId, timesheet?.weekStart],
    queryFn: () => getTimeEntries({ 
      userId: timesheet!.userId,
      fromDate: timesheet!.weekStart,
      toDate: getWeekEnd(timesheet!.weekStart)
    }),
    enabled: !!timesheet,
  })

  const reviewMutation = useMutation({
    mutationFn: ({ approved, reason }: { approved: boolean; reason?: string }) =>
      reviewTimesheet(id!, approved ? 'APPROVED' : 'REJECTED', reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] })
      queryClient.invalidateQueries({ queryKey: ['timesheetsPendingApproval'] })
      queryClient.invalidateQueries({ queryKey: ['timesheet', id] })
      toast.success(variables.approved ? 'Timesheet approved successfully' : 'Timesheet rejected')
      setApproveDialogOpen(false)
      setRejectDialogOpen(false)
      setRejectionReason('')
      navigate('/app/time?tab=approvals')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to review timesheet')
    },
  })

  const handleApprove = () => {
    reviewMutation.mutate({ approved: true })
  }

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    reviewMutation.mutate({ approved: false, reason: rejectionReason })
  }

  const canReview = timesheet && timesheet.status === 'SUBMITTED'

  const isLoading = timesheetLoading || entriesLoading

  if (isLoading) {
    return (
      <ContentSection>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </ContentSection>
    )
  }

  if (!timesheet) {
    return (
      <ContentSection>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-semibold">Timesheet not found</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Go Back
          </Button>
        </div>
      </ContentSection>
    )
  }

  return (
    <ContentSection>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Timesheet Details</h1>
              <p className="text-muted-foreground mt-1">
                {timesheet.userName || `User ${timesheet.userId.substring(0, 8)}`} - Week of {formatDate(timesheet.weekStart)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={timesheet.status} />
            {canReview && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setRejectDialogOpen(true)}
                  disabled={reviewMutation.isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button 
                  onClick={() => setApproveDialogOpen(true)}
                  disabled={reviewMutation.isPending}
                >
                  {reviewMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Rejection Banner */}
        {timesheet.status === 'REJECTED' && timesheet.rejectionReason && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Rejected:</strong> {timesheet.rejectionReason}
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[var(--accent-primary-weak)] rounded-lg">
                <Clock className="w-5 h-5 text-[var(--accent-primary)]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Hours</p>
                <p className="text-xl font-bold">{formatMinutesToHours(timesheet.totalMinutes)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[var(--accent-success)]/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-[var(--accent-success)]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Billable Hours</p>
                <p className="text-xl font-bold">{formatMinutesToHours(timesheet.billableMinutes)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Non-Billable Hours</p>
                <p className="text-xl font-bold">{formatMinutesToHours(timesheet.nonBillableMinutes)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Daily Breakdown */}
        <Card>
          <div className="p-4">
            <h3 className="text-sm font-semibold mb-3">Daily Breakdown</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total Hours</TableHead>
                  <TableHead className="text-right">Billable</TableHead>
                  <TableHead className="text-right">Non-Billable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timesheet.dailyBreakdown?.map((day) => (
                  <TableRow key={day.date}>
                    <TableCell className="font-medium">
                      {formatDateLong(day.date)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMinutesToHours(day.totalMinutes)}
                    </TableCell>
                    <TableCell className="text-right text-[var(--accent-success)]">
                      {formatMinutesToHours(day.billableMinutes)}
                    </TableCell>
                    <TableCell className="text-right text-gray-600 dark:text-gray-400">
                      {formatMinutesToHours(day.nonBillableMinutes)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Time Entries Details */}
        <Card>
          <div className="p-4">
            <h3 className="text-sm font-semibold mb-3">Time Entries</h3>
            {timeEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No time entries for this week</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {formatDate(entry.date)}
                      </TableCell>
                      <TableCell>{entry.projectName || '-'}</TableCell>
                      <TableCell>{entry.taskName || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {entry.description || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMinutesToHours(calculateDuration(entry))}
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.isBillable ? 'default' : 'secondary'}>
                          {entry.isBillable ? 'Billable' : 'Non-billable'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      </div>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Timesheet</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this timesheet for {timesheet.userName}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setApproveDialogOpen(false)}
              disabled={reviewMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleApprove}
              disabled={reviewMutation.isPending}
            >
              {reviewMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Approve
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
              Please provide a reason for rejecting this timesheet.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setRejectDialogOpen(false)
                setRejectionReason('')
              }}
              disabled={reviewMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleReject}
              disabled={reviewMutation.isPending || !rejectionReason.trim()}
            >
              {reviewMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ContentSection>
  )
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { icon: any; className: string }> = {
    DRAFT: { icon: FileText, className: 'bg-muted text-muted-foreground' },
    SUBMITTED: { icon: Clock, className: 'bg-[var(--accent-primary-weak)] text-[var(--accent-primary)]' },
    APPROVED: { icon: CheckCircle, className: 'bg-[var(--accent-success)]/10 text-[var(--accent-success)]' },
    REJECTED: { icon: XCircle, className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  }

  const config = variants[status] || variants.DRAFT
  const Icon = config.icon

  return (
    <Badge className={`${config.className} text-base px-4 py-2`}>
      <Icon className="w-4 h-4 mr-2" />
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

function formatDateLong(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'short', 
    day: 'numeric'
  })
}

function formatMinutesToHours(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

function getWeekEnd(weekStart: string): string {
  const date = new Date(weekStart)
  date.setDate(date.getDate() + 6)
  return date.toISOString().split('T')[0]
}

function calculateDuration(entry: TimeEntry): number {
  if (entry.endTime && entry.startTime) {
    const start = new Date(entry.startTime)
    const end = new Date(entry.endTime)
    return Math.floor((end.getTime() - start.getTime()) / 60000)
  }
  return 0
}
