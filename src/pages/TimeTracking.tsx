import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Play, Square, Plus, Loader2, Clock, DollarSign, Calendar } from 'lucide-react'
import ContentSection from '@/components/common/ContentSection'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { timeEntryService, type TimeEntry, type StartTimerRequest, type CreateManualTimeEntryRequest, type UpdateTimeEntryRequest } from '@/services/timeEntryService'
import { projectService } from '@/services/projectService'
import { taskService } from '@/services/taskService'
import { useUserRole } from '@/hooks/useUserRole'
import { StartTimerDialog } from '@/components/time/StartTimerDialog.tsx'
import { ManualEntryDialog } from '@/components/time/ManualEntryDialog.tsx'
import { TimeEntriesTable } from '@/components/time/TimeEntriesTable.tsx'

export default function TimeTracking() {
  const { role } = useUserRole()
  const queryClient = useQueryClient()
  const [startTimerOpen, setStartTimerOpen] = useState(false)
  const [manualEntryOpen, setManualEntryOpen] = useState(false)
  const [elapsedMinutes, setElapsedMinutes] = useState(0)

  // Fetch active timer
  const { data: activeTimer, isLoading: timerLoading } = useQuery({
    queryKey: ['activeTimer'],
    queryFn: () => timeEntryService.getActiveTimer(),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Fetch time entries
  const { data: timeEntries = [], isLoading: entriesLoading } = useQuery<TimeEntry[]>({
    queryKey: ['timeEntries'],
    queryFn: () => timeEntryService.getTimeEntries(),
  })

  // Fetch projects for enrichment
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
  })

  // Fetch tasks for enrichment
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => taskService.getTasks(),
  })

  // Start timer mutation
  const startTimerMutation = useMutation({
    mutationFn: (payload: StartTimerRequest) => timeEntryService.startTimer(payload),
    onSuccess: () => {
      toast.success('Timer started')
      queryClient.invalidateQueries({ queryKey: ['activeTimer'] })
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
      setStartTimerOpen(false)
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to start timer')
    },
  })

  // Stop timer mutation
  const stopTimerMutation = useMutation({
    mutationFn: () => timeEntryService.stopTimer(),
    onSuccess: () => {
      toast.success('Timer stopped')
      queryClient.invalidateQueries({ queryKey: ['activeTimer'] })
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to stop timer')
    },
  })

  // Create manual entry mutation
  const createManualMutation = useMutation({
    mutationFn: (payload: CreateManualTimeEntryRequest) => timeEntryService.createManualEntry(payload),
    onSuccess: () => {
      toast.success('Time entry created')
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
      setManualEntryOpen(false)
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to create entry')
    },
  })

  // Update entry mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTimeEntryRequest }) =>
      timeEntryService.updateEntry(id, payload),
    onSuccess: () => {
      toast.success('Time entry updated')
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to update entry')
    },
  })

  // Delete entry mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => timeEntryService.deleteEntry(id),
    onSuccess: () => {
      toast.success('Time entry deleted')
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to delete entry')
    },
  })

  // Update elapsed time for active timer
  useEffect(() => {
    if (!activeTimer || !activeTimer.isActive || !activeTimer.startTime) {
      return
    }

    const updateElapsed = () => {
      const start = new Date(activeTimer.startTime!)
      const now = new Date()
      const minutes = Math.floor((now.getTime() - start.getTime()) / 60000)
      setElapsedMinutes(minutes)
    }

    updateElapsed()
    const interval = setInterval(updateElapsed, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [activeTimer])

  // Calculate totals
  const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0)
  const billableHours = timeEntries.reduce((sum, entry) => 
    sum + (entry.isBillable ? (entry.hours || 0) : 0), 0
  )

  // Enrich entries
  const enrichedEntries = timeEntries.map(entry => ({
    ...entry,
    projectName: projects.find(p => p.id === entry.projectId)?.name || 'Unknown Project',
    taskName: entry.taskId ? tasks.find(t => t.id === entry.taskId)?.title || 'Unknown Task' : undefined,
  }))

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <ContentSection>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Time Tracking</h1>
            <p className="text-muted-foreground mt-1">Track your time and manage entries</p>
          </div>
        </div>

        {/* Active Timer Widget */}
        <Card className="p-6">
          {timerLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : activeTimer && activeTimer.isActive ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-600 dark:text-green-400 animate-pulse" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Timer running</p>
                  <p className="font-semibold">
                    {projects.find(p => p.id === activeTimer.projectId)?.name || 'Project'}
                    {activeTimer.taskId && ` - ${tasks.find(t => t.id === activeTimer.taskId)?.title || 'Task'}`}
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatDuration(elapsedMinutes)}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => stopTimerMutation.mutate()}
                disabled={stopTimerMutation.isPending}
                variant="destructive"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop Timer
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold">No active timer</p>
                  <p className="text-sm text-muted-foreground">Start a timer to track your time</p>
                </div>
              </div>
              <Button onClick={() => setStartTimerOpen(true)}>
                <Play className="w-4 h-4 mr-2" />
                Start Timer
              </Button>
            </div>
          )}
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold">{totalHours}h</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Billable Hours</p>
                <p className="text-2xl font-bold">{billableHours}h</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <Calendar className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Entries</p>
                <p className="text-2xl font-bold">{timeEntries.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={() => setManualEntryOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Manual Entry
          </Button>
        </div>

        {/* Time Entries Table */}
        <TimeEntriesTable
          entries={enrichedEntries}
          isLoading={entriesLoading}
          onUpdate={(id: string, payload: UpdateTimeEntryRequest) => updateMutation.mutate({ id, payload })}
          onDelete={(id: string) => deleteMutation.mutate(id)}
          role={role}
        />

        {/* Dialogs */}
        <StartTimerDialog
          open={startTimerOpen}
          onOpenChange={setStartTimerOpen}
          onSubmit={(payload: StartTimerRequest) => startTimerMutation.mutate(payload)}
          isLoading={startTimerMutation.isPending}
          projects={projects}
          tasks={tasks}
        />

        <ManualEntryDialog
          open={manualEntryOpen}
          onOpenChange={setManualEntryOpen}
          onSubmit={(payload: CreateManualTimeEntryRequest) => createManualMutation.mutate(payload)}
          isLoading={createManualMutation.isPending}
          projects={projects}
          tasks={tasks}
        />
      </div>
    </ContentSection>
  )
}
