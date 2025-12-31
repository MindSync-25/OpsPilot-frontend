import { useQuery } from '@tanstack/react-query'
import { Clock, DollarSign, Calendar, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { timeEntryService, type TimeEntry } from '@/services/timeEntryService'
import { taskService } from '@/services/taskService'
import { formatDate } from '@/lib/time'

interface ProjectTimeViewProps {
  projectId: string
}

export function ProjectTimeView({ projectId }: ProjectTimeViewProps) {
  // Fetch time entries for this project
  const { data: timeEntries = [], isLoading } = useQuery<TimeEntry[]>({
    queryKey: ['timeEntries', projectId],
    queryFn: () => timeEntryService.getTimeEntries({ projectId }),
  })

  // Fetch tasks for task names
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => taskService.getTasks(),
  })

  // Calculate totals
  const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0)
  const billableHours = timeEntries.reduce((sum, entry) => 
    sum + (entry.isBillable ? (entry.hours || 0) : 0), 0
  )
  const nonBillableHours = totalHours - billableHours

  const formatDuration = (minutes: number | undefined) => {
    if (!minutes) return '-'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold">{totalHours}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Billable Hours</p>
                <p className="text-2xl font-bold">{billableHours}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <Calendar className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Non-Billable Hours</p>
                <p className="text-2xl font-bold">{nonBillableHours}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Time Entries</CardTitle>
          <CardDescription>All time entries logged for this project</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : timeEntries.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No time entries found for this project</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Billable</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeEntries.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.date ? formatDate(entry.date) : '-'}</TableCell>
                      <TableCell>
                        {entry.taskId
                          ? tasks.find(t => t.id === entry.taskId)?.title || 'Unknown Task'
                          : '-'}
                      </TableCell>
                      <TableCell>{entry.hours || 0}h</TableCell>
                      <TableCell>{entry.durationMinutes ? formatDuration(entry.durationMinutes) : '-'}</TableCell>
                      <TableCell>
                        {entry.isBillable ? (
                          <Badge variant="default">Billable</Badge>
                        ) : (
                          <Badge variant="secondary">Non-billable</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.isActive ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline">Stopped</Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{entry.description || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
