import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Clock, DollarSign, FileText, CheckCircle, XCircle, AlertCircle, Send, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { getMyTimesheet, submitMyTimesheet, type TimesheetResponse } from '@/services/timesheetService'
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

export default function MyTimesheet() {
  const queryClient = useQueryClient()
  const [selectedWeek, setSelectedWeek] = useState(() => getMonday(new Date()))
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false)

  const weekStart = useMemo(() => formatDate(selectedWeek), [selectedWeek])

  const { data: timesheet, isLoading } = useQuery<TimesheetResponse>({
    queryKey: ['myTimesheet', weekStart],
    queryFn: () => getMyTimesheet(weekStart),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  })

  const submitMutation = useMutation({
    mutationFn: () => submitMyTimesheet(weekStart),
    onSuccess: () => {
      toast.success('Timesheet submitted for approval')
      queryClient.invalidateQueries({ queryKey: ['myTimesheet', weekStart] })
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to submit timesheet')
    },
  })

  const previousWeek = () => {
    const prev = new Date(selectedWeek)
    prev.setDate(prev.getDate() - 7)
    setSelectedWeek(prev)
  }

  const nextWeek = () => {
    const next = new Date(selectedWeek)
    next.setDate(next.getDate() + 7)
    setSelectedWeek(next)
  }

  const currentWeek = () => {
    setSelectedWeek(getMonday(new Date()))
  }

  const handleSubmit = () => {
    setSubmitDialogOpen(true)
  }

  const confirmSubmit = () => {
    submitMutation.mutate()
    setSubmitDialogOpen(false)
  }

  const canSubmit = timesheet?.status === 'DRAFT' && 
    (timesheet.totalMinutes > 0 || timesheet.billableMinutes > 0)

  return (
    <div className="space-y-6">
      {/* Week Selector */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={previousWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-center">
            <p className="font-semibold">{formatWeekRange(selectedWeek)}</p>
            <p className="text-sm text-muted-foreground">Week of {formatDate(selectedWeek)}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={currentWeek}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={nextWeek}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      ) : timesheet ? (
        <>
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
                <div className="p-2 bg-[var(--accent-primary-weak)] rounded-lg">
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
                <div className="p-2 bg-[var(--accent-success)]/10 rounded-lg">
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
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Non-Billable Hours</p>
                  <p className="text-xl font-bold">{formatMinutesToHours(timesheet.nonBillableMinutes)}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Status and Actions */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="font-semibold">Status:</p>
                <StatusBadge status={timesheet.status} />
              </div>
              {canSubmit && (
                <Button 
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit for Approval
                </Button>
              )}
            </div>
          </Card>

          {/* Daily Breakdown */}
          <Card>
            <div className="p-4">
              <h3 className="text-base font-semibold mb-3">Daily Breakdown</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead className="text-right">Logged</TableHead>
                    <TableHead className="text-right">Billable</TableHead>
                    <TableHead className="text-right">Non-Billable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getDailyBreakdown(selectedWeek, timesheet.dailyBreakdown).map((day) => (
                    <TableRow key={day.date}>
                      <TableCell className="font-medium">{formatDate(new Date(day.date))}</TableCell>
                      <TableCell>{day.dayName}</TableCell>
                      <TableCell className="text-right">{day.logged}</TableCell>
                      <TableCell className="text-right text-[var(--accent-success)]">{day.billable}</TableCell>
                      <TableCell className="text-right text-gray-600 dark:text-gray-400">{day.nonBillable}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Project Breakdown (if available) */}
          {timesheet.projectBreakdown && timesheet.projectBreakdown.length > 0 && (
            <Card>
              <div className="p-4">
                <h3 className="text-base font-semibold mb-3">Project Breakdown</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead className="text-right">Total Hours</TableHead>
                      <TableHead className="text-right">Billable</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timesheet.projectBreakdown.map((project) => (
                      <TableRow key={project.projectId}>
                        <TableCell className="font-medium">{project.projectName}</TableCell>
                        <TableCell className="text-right">{formatMinutesToHours(project.totalMinutes)}</TableCell>
                        <TableCell className="text-right text-[var(--accent-success)]">
                          {formatMinutesToHours(project.billableMinutes)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </>
      ) : (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No timesheet data available for this week</p>
          </div>
        </Card>
      )}

      {/* Submit Confirmation Dialog */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Timesheet</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit this timesheet for approval? You won't be able to make changes once submitted.
            </DialogDescription>
          </DialogHeader>
          {timesheet && (
            <div className="py-4 space-y-2">
              <p><strong>Week:</strong> {formatWeekRange(selectedWeek)}</p>
              <p><strong>Total Hours:</strong> {formatMinutesToHours(timesheet.totalMinutes)}</p>
              <p><strong>Billable Hours:</strong> {formatMinutesToHours(timesheet.billableMinutes)}</p>
              <p><strong>Non-Billable Hours:</strong> {formatMinutesToHours(timesheet.nonBillableMinutes)}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmSubmit}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Timesheet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { icon: any; className: string }> = {
    DRAFT: { icon: AlertCircle, className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
    SUBMITTED: { icon: Clock, className: 'bg-[var(--accent-primary-weak)] text-[var(--accent-primary)]' },
    APPROVED: { icon: CheckCircle, className: 'bg-[var(--accent-success)]/10 text-[var(--accent-success)]' },
    REJECTED: { icon: XCircle, className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  }

  const config = variants[status] || variants.DRAFT
  const Icon = config.icon

  return (
    <Badge className={config.className}>
      <Icon className="w-3 h-3 mr-1" />
      {status}
    </Badge>
  )
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${monday.toLocaleDateString('en-US', options)} - ${sunday.toLocaleDateString('en-US', options)}`
}

function formatMinutesToHours(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

function getDailyBreakdown(monday: Date, backendBreakdown?: any[]) {
  const days = []
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  
  // Create a map of backend data by date
  const breakdownMap = new Map()
  if (backendBreakdown) {
    backendBreakdown.forEach(day => {
      breakdownMap.set(day.date, day)
    })
  }
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setDate(date.getDate() + i)
    const dateStr = formatDate(date)
    const dayData = breakdownMap.get(dateStr)
    
    days.push({
      date: dateStr,
      dayName: dayNames[i],
      logged: dayData ? formatMinutesToHours(dayData.totalMinutes) : '0h',
      billable: dayData ? formatMinutesToHours(dayData.billableMinutes) : '0h',
      nonBillable: dayData ? formatMinutesToHours(dayData.nonBillableMinutes) : '0h',
    })
  }
  
  return days
}
